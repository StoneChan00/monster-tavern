/**
 * 魔物酒馆 · 核心类型定义（可序列化，直接构成存档结构）
 *
 * 约定：
 * - 引擎函数直接就地修改传入的 state 并返回它（单一所有者是 store；
 *   测试需要快照时自行 structuredClone）。
 * - state.log 是战斗/掉落事件的唯一记录流 —— Phase 2 战斗视口将订阅它做动画回放。
 */

export const SAVE_VERSION = 1;

export type Rarity = 'common' | 'fine' | 'rare' | 'epic' | 'legendary';
export type ClassId = string;
export type MonsterId = string;
export type MaterialId = string;
export type RecipeId = string;
export type FloorId = string;

export type BuffStat = 'atk' | 'def' | 'hp' | 'spd' | 'expGain' | 'dropRate';

export interface BaseStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface AdventurerState {
  id: string;
  name: string;
  classId: ClassId;
  rarity: Rarity;
  level: number;
  exp: number;
  hp: number; // 当前 HP（上限由 getEffectiveStats 计算）
  loyalty: number; // 0~100
}

export interface MonsterInstance {
  uid: number;
  monsterId: MonsterId;
  hp: number;
  maxHp: number;
}

export type DungeonStatus = 'combat' | 'waveRest' | 'resting';

export interface CookingJob {
  recipeId: RecipeId;
  remainingS: number;
  totalS: number;
}

export interface ActiveBuff {
  recipeId: RecipeId;
  label: string;
  stat: BuffStat;
  mult: number; // 乘数，1.25 = +25%
  remainingS: number;
  totalS: number;
}

export type LogKind = 'combat' | 'loot' | 'level' | 'kitchen' | 'tavern' | 'system';
export interface LogEntry {
  id: number;
  time: number; // Unix ms
  kind: LogKind;
  text: string;
}

export interface GameState {
  version: number;
  meta: {
    createdAt: number;
    lastSavedAt: number;
    nextUid: number;
    lifetimeGoldEarned: number;
    lifetimeExpEarned: number;
    totalWavesCleared: number;
    totalBossKills: number;
    bossFirstCleared: boolean;
  };
  player: {
    gold: number;
    reputation: number;
  };
  adventurer: AdventurerState;
  inventory: Record<string, number>;
  kitchen: {
    job: CookingJob | null;
    unlockedRecipes: RecipeId[];
    buffs: ActiveBuff[];
  };
  tavern: {
    trainingGround: number; // 训练场等级 0~5
  };
  dungeon: {
    floorId: FloorId;
    waveIndex: number; // 0-based
    status: DungeonStatus;
    restRemainingS: number; // waveRest / resting 剩余秒数
    monsters: MonsterInstance[];
  };
  log: LogEntry[];
}

export interface TickOptions {
  /** 离线结算：金币/经验/掉落收益 × OFFLINE_EFFICIENCY */
  offline?: boolean;
  /** 可注入 RNG（测试确定性用），默认 Math.random */
  rng?: () => number;
}

/** 「欢迎回来」离线结算摘要 */
export interface OfflineReport {
  awaySeconds: number;
  appliedSeconds: number;
  efficiency: number;
  gold: number;
  exp: number;
  levelsGained: number;
  materials: Record<string, number>;
  wavesCleared: number;
  bossKills: number;
}
