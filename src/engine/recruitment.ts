import { BALANCE, visitBatchSize } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES, RACE_LIST } from '../data/races';
import { RECIPES } from '../data/recipes';
import type { GameState, Rarity, Visitor } from './types';

const RARITIES: Rarity[] = ['common', 'fine', 'rare', 'epic', 'legendary'];

/** 稀有度到访权重：随声望逐步向高稀有度倾斜 */
function rarityWeights(reputation: number): number[] {
  return [
    Math.max(15, 55 - reputation * 0.5),
    28 + reputation * 0.1,
    12 + reputation * 0.3,
    4 + reputation * 0.15,
    1 + reputation * 0.08,
  ];
}

function pickWeighted<T>(items: T[], weights: number[], rng: () => number): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}

/** 职业到访权重：基础 10 + 已解锁菜谱的吸引力加成（美食即招募） */
export function classWeights(state: GameState): Map<string, number> {
  const weights = new Map<string, number>();
  for (const cid of Object.keys(CLASSES)) {
    let w = 10;
    for (const rid of state.kitchen.unlockedRecipes) {
      const r = RECIPES[rid];
      if (r && r.attraction.classIds.includes(cid)) w += r.attraction.weight;
    }
    weights.set(cid, w);
  }
  return weights;
}

/** 签约消耗的基准材料（按稀有度） */
const SIGN_MATERIAL: Record<Rarity, { materialId: string; count: number }> = {
  common: { materialId: 'mat_carapace', count: 3 },
  fine: { materialId: 'mat_carapace', count: 8 },
  rare: { materialId: 'mat_mithril', count: 2 },
  epic: { materialId: 'mat_mithril', count: 5 },
  legendary: { materialId: 'mat_core', count: 2 },
};

/**
 * 生成一批到访冒险者。
 * 种族按种族权重随机；职业分布 ← 已解锁菜谱的吸引力；稀有度分布 ← 酒馆声望；
 * 姓名取自种族名字池（D&D 风味）。
 */
export function generateVisitors(state: GameState, rng: () => number): Visitor[] {
  const size = visitBatchSize(state.tavern.lounge);
  const classIds = Object.keys(CLASSES);
  const cWeights = classWeights(state);
  const rWeights = rarityWeights(state.player.reputation);
  const visitors: Visitor[] = [];
  for (let i = 0; i < size; i++) {
    const classId = pickWeighted(classIds, classIds.map((c) => cWeights.get(c) ?? 10), rng);
    const raceDef = pickWeighted(RACE_LIST, RACE_LIST.map((r) => r.weight), rng);
    const rarity = pickWeighted(RARITIES, rWeights, rng);
    const cls = CLASSES[classId];
    const race = RACES[raceDef.id] ?? RACES.human;
    const name = race.namePool[Math.floor(rng() * race.namePool.length)];
    visitors.push({
      uid: state.meta.nextUid++,
      name,
      classId,
      race: cls && race ? race.id : 'human',
      rarity,
      costGold: BALANCE.SIGN_COST_GOLD[RARITIES.indexOf(rarity)],
      costMaterial: { ...SIGN_MATERIAL[rarity] },
    });
  }
  return visitors;
}
