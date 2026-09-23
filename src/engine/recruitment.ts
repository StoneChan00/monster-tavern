import { visitBatchSize, signCostOfLevel, signMaterialOfLevel, visitorLevelWeights } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES, RACE_LIST } from '../data/races';
import { RECIPES } from '../data/recipes';
import { LEVEL_CAP } from './types';
import type { GameState, Visitor } from './types';

const LEVELS = Array.from({ length: LEVEL_CAP }, (_, i) => i + 1); // 1~10

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

/**
 * 生成一批到访冒险者（D&D 等级制）。
 * 种族按种族权重随机；职业分布 ← 已解锁菜谱的吸引力；
 * 等级分布 ← 声望温和倾斜（Lv9-10 始终极稀有）；
 * 姓名取自种族名字池（D&D 风味）。
 */
export function generateVisitors(state: GameState, rng: () => number): Visitor[] {
  const size = visitBatchSize(state.tavern.lounge);
  const classIds = Object.keys(CLASSES);
  const cWeights = classWeights(state);
  const lWeights = visitorLevelWeights(state.player.reputation);
  const visitors: Visitor[] = [];
  for (let i = 0; i < size; i++) {
    const classId = pickWeighted(classIds, classIds.map((c) => cWeights.get(c) ?? 10), rng);
    const raceDef = pickWeighted(RACE_LIST, RACE_LIST.map((r) => r.weight), rng);
    const level = pickWeighted(LEVELS, lWeights, rng);
    const cls = CLASSES[classId];
    const race = RACES[raceDef.id] ?? RACES.human;
    const name = race.namePool[Math.floor(rng() * race.namePool.length)];
    visitors.push({
      uid: state.meta.nextUid++,
      name,
      classId,
      race: cls && race ? race.id : 'human',
      level,
      costGold: signCostOfLevel(level),
      costMaterial: { ...signMaterialOfLevel(level) },
    });
  }
  return visitors;
}
