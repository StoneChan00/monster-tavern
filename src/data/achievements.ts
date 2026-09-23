import { MAP_DEFS, MONSTERS } from './monsters';
import { RECIPES } from './recipes';
import { RACE_LIST } from './races';
import type { GameState, MonsterId } from '../engine/types';

/**
 * 派生式成就：`check(state)` 直接从当前状态推导，无需存档。
 * 优点：永不丢进度、不占存档字段；代价是无法记录"曾拥有"类历史
 * （传奇之约/万国来朝 因此按当前 roster 判定）。
 */

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  check: (state: GameState) => boolean;
}

/** 累计击杀魔物总数（图鉴击杀表求和） */
export function totalMonsterKills(state: GameState): number {
  return Object.values(state.meta.monsterKills).reduce<number>((sum, n) => sum + (n ?? 0), 0);
}

/** 图鉴已发现（击杀过至少一次）的魔物种数 */
export function discoveredMonsterCount(state: GameState): number {
  return Object.keys(state.meta.monsterKills).filter((id) => MONSTERS[id as MonsterId]).length;
}

/** 全魔物种数 */
export const MONSTER_SPECIES_COUNT = Object.keys(MONSTERS).length;

function clearedMap(state: GameState, map: number): boolean {
  return state.meta.mapsFirstCleared.includes(map);
}

function killsAtLeast(state: GameState, n: number): boolean {
  return totalMonsterKills(state) >= n;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'open_for_business',
    name: '开门营业',
    desc: '肃清第一波魔物',
    icon: '🍺',
    check: (s) => s.meta.totalWavesCleared >= 1,
  },
  {
    id: 'first_squad',
    name: '小队初成',
    desc: '酒馆雇佣 3 名冒险者',
    icon: '🧑‍🤝‍🧑',
    check: (s) => s.roster.length >= 3,
  },
  {
    id: 'full_party',
    name: '满编出征',
    desc: '5 个编队槽位全部就位',
    icon: '⚔️',
    check: (s) => s.party.length >= 5 && s.party.every((x) => x !== null),
  },
  {
    id: 'map_2',
    name: '深入矿道',
    desc: '首杀秘银矿道（图2）的 BOSS',
    icon: '⛏️',
    check: (s) => clearedMap(s, 2),
  },
  {
    id: 'map_4',
    name: '深入裂隙',
    desc: '首杀熔岩裂隙（图4）的 BOSS',
    icon: '🔥',
    check: (s) => clearedMap(s, 4),
  },
  {
    id: 'map_6',
    name: '终焉征服者',
    desc: '首杀虚空终焉（图6）的 BOSS',
    icon: '🌌',
    check: (s) => clearedMap(s, 6),
  },
  {
    id: 'slayer_50',
    name: '魔物克星',
    desc: '累计击杀 50 只魔物',
    icon: '🗡️',
    check: (s) => killsAtLeast(s, 50),
  },
  {
    id: 'slayer_100',
    name: '百魔斩',
    desc: '累计击杀 100 只魔物',
    icon: '💀',
    check: (s) => killsAtLeast(s, 100),
  },
  {
    id: 'slayer_1000',
    name: '千魔斩',
    desc: '累计击杀 1000 只魔物',
    icon: '☠️',
    check: (s) => killsAtLeast(s, 1000),
  },
  {
    id: 'boss_slayer',
    name: '屠魔者',
    desc: '击败 10 只 BOSS',
    icon: '🐉',
    check: (s) => s.meta.totalBossKills >= 10,
  },
  {
    id: 'gourmet',
    name: '魔物美食家',
    desc: `解锁全部 ${Object.keys(RECIPES).length} 道菜谱`,
    icon: '🍽️',
    check: (s) => s.kitchen.unlockedRecipes.length >= Object.keys(RECIPES).length,
  },
  {
    id: 'feast_50',
    name: '宴席常开',
    desc: '累计出餐 50 次',
    icon: '🍲',
    check: (s) => s.meta.dishesCooked >= 50,
  },
  {
    id: 'gold_10k',
    name: '日进斗金',
    desc: '累计赚取 10000 金币',
    icon: '💰',
    check: (s) => s.meta.lifetimeGoldEarned >= 10_000,
  },
  {
    id: 'legendary_pact',
    name: '传奇之约',
    desc: '与 10 级（传奇）冒险者签约——整个世界屈指可数',
    icon: '✨',
    check: (s) => s.roster.some((a) => a.level >= 10),
  },
  {
    id: 'nine_races',
    name: '万国来朝',
    desc: `同时拥有 ${RACE_LIST.length} 大种族的冒险者`,
    icon: '🌍',
    check: (s) => new Set(s.roster.map((a) => a.race)).size >= RACE_LIST.length,
  },
  {
    id: 'codex_half',
    name: '见多识广',
    desc: `图鉴收录过半魔物（${Math.ceil(MONSTER_SPECIES_COUNT / 2)}/${MONSTER_SPECIES_COUNT}）`,
    icon: '📖',
    check: (s) => discoveredMonsterCount(s) >= Math.ceil(MONSTER_SPECIES_COUNT / 2),
  },
  {
    id: 'codex_full',
    name: '魔物百科',
    desc: `图鉴收录全部魔物（${MONSTER_SPECIES_COUNT} 种）`,
    icon: '📚',
    check: (s) => discoveredMonsterCount(s) >= MONSTER_SPECIES_COUNT,
  },
];

/**
 * 图鉴展示顺序：按 MAP_DEFS 各图魔物池中的首次出现顺序（常规池 → BOSS 池）；
 * 未出现在任何地图的魔物（数据兜底）追加在末尾。
 * CODEX_MONSTER_MAP：每种魔物首次出现的地图编号（图鉴标注用）。
 */
export const CODEX_MONSTER_ORDER: MonsterId[] = (() => {
  const seen = new Set<MonsterId>();
  const order: MonsterId[] = [];
  for (const map of MAP_DEFS) {
    for (const mid of [...map.monsterPool, ...map.bossPool]) {
      if (!seen.has(mid)) {
        seen.add(mid);
        order.push(mid);
      }
    }
  }
  for (const mid of Object.keys(MONSTERS) as MonsterId[]) {
    if (!seen.has(mid)) {
      seen.add(mid);
      order.push(mid);
    }
  }
  return order;
})();

export const CODEX_MONSTER_MAP: Partial<Record<MonsterId, number>> = (() => {
  const map: Partial<Record<MonsterId, number>> = {};
  for (const m of MAP_DEFS) {
    for (const mid of [...m.monsterPool, ...m.bossPool]) {
      if (map[mid] === undefined) map[mid] = m.number;
    }
  }
  return map;
})();
