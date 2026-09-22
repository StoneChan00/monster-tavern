/**
 * 魔物酒馆 · 核心类型定义 v2（Phase 1：多冒险者/招募/多设施/多层地牢）
 *
 * 约定：
 * - 引擎函数直接就地修改传入的 state 并返回它（单一所有者是 store；
 *   测试需要快照时自行 structuredClone）。
 * - state.log 是战斗/掉落事件的唯一记录流 —— Phase 2 战斗视口将订阅它做动画回放。
 * - meta.now 是"模拟时钟"（每 tick +1000ms）：招募到访、日薪结算都基于它推进，
 *   保证离线快进与在线经历完全一致的时间事件。
 */

export const SAVE_VERSION = 3;

export type Rarity = 'common' | 'fine' | 'rare' | 'epic' | 'legendary';
export type ClassId = string;
export type RaceId = string;
export type MonsterId = string;
export type MaterialId = string;
export type RecipeId = string;
export type FloorId = string;

export type BuffStat = 'atk' | 'def' | 'hp' | 'spd' | 'expGain' | 'dropRate';

/** 职业战斗行为 */
export type CombatStyle = 'strike' | 'aoe' | 'assassin' | 'heal' | 'snipe' | 'inspire';

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
  /** D&D 5E 种族（属性修正 + 名字风味） */
  race: RaceId;
  rarity: Rarity;
  level: number;
  exp: number;
  hp: number; // 当前 HP（上限由 getAdventurerStats 计算）
  loyalty: number; // 0~100；归零离店
}

/** 到访酒馆、可签约的冒险者 */
export interface Visitor {
  uid: number;
  name: string;
  classId: ClassId;
  race: RaceId;
  rarity: Rarity;
  costGold: number;
  costMaterial: { materialId: MaterialId; count: number };
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
  time: number; // 模拟时钟（meta.now）
  kind: LogKind;
  text: string;
}

/**
 * 结构化战斗事件流 —— Phase 2 BattleViewport 的回放数据源。
 * 与文本日志（state.log）并行生成：log 面向玩家阅读，events 面向渲染回放。
 */
export type EngineEvent =
  /** 冒险者 → 魔物 */
  | {
      kind: 'hit';
      attackerSide: 'party';
      attackerId: string;
      targetUid: number;
      targetMonsterId: MonsterId;
      damage: number;
      crit: boolean;
    }
  /** 魔物 → 冒险者 */
  | {
      kind: 'hit';
      attackerSide: 'monster';
      attackerUid: number;
      attackerMonsterId: MonsterId;
      targetId: string;
      damage: number;
      crit: boolean;
    }
  | { kind: 'heal'; healerId: string; targetId: string; amount: number }
  | { kind: 'death'; side: 'party'; targetId: string }
  | { kind: 'death'; side: 'monster'; targetUid: number; targetMonsterId: MonsterId }
  | {
      kind: 'waveStart';
      wave: number; // 1-based
      waveCount: number;
      isBoss: boolean;
      monsters: Array<{ uid: number; monsterId: MonsterId }>;
    }
  | { kind: 'waveClear'; wave: number; isBoss: boolean }
  | { kind: 'wipe' }
  | { kind: 'revive' }
  | { kind: 'levelup'; targetId: string; level: number };

/** 带唯一序号与时间戳的事件记录（瞬态：不存档，随存档剥离） */
export type EventRecord = EngineEvent & { id: number; time: number };

export interface GameState {
  version: number;
  meta: {
    createdAt: number;
    lastSavedAt: number;
    /** 模拟时钟（Unix ms），每 tick +1000 */
    now: number;
    nextUid: number;
    lifetimeGoldEarned: number;
    lifetimeExpEarned: number;
    totalWavesCleared: number;
    totalBossKills: number;
    /** 已首杀 BOSS 的楼层（首杀声望仅一次） */
    floorsFirstCleared: FloorId[];
  };
  player: {
    gold: number;
    reputation: number;
  };
  /** 已签约冒险者（编队 + 替补席） */
  roster: AdventurerState[];
  /** 5 个编队槽位，存 roster id；顺序 = 槽位编号，站位由 SLOT_ROWS 决定 */
  party: (string | null)[];
  recruitment: {
    visitors: Visitor[];
    /** 下批到访的模拟时间（Unix ms） */
    nextVisitAt: number;
    /** 上次日薪结算的模拟天数 */
    lastWageDay: number;
  };
  inventory: Record<string, number>;
  kitchen: {
    job: CookingJob | null;
    unlockedRecipes: RecipeId[];
    buffs: ActiveBuff[];
  };
  tavern: {
    trainingGround: number; // 训练场 0~5：等级上限/全属性
    lounge: number; // 招待区 0~5：替补席上限/到访批次
    kitchen: number; // 厨房 0~4：生效菜谱数/烹饪速度
    dorm: number; // 宿舍 0~5：休整速度/忠诚保护
    intel: number; // 情报网 0~4：掉落情报/预览层数
  };
  dungeon: {
    floorId: FloorId;
    waveIndex: number; // 0-based
    status: DungeonStatus;
    restRemainingS: number; // waveRest / resting 剩余秒数
    monsters: MonsterInstance[];
    /** 已解锁的最高层（数字 1~10） */
    highestFloor: number;
    /** 驻farm层（玩家可随时切换，≤ highestFloor） */
    farmFloor: number;
  };
  log: LogEntry[];
  /** 瞬态事件流（回放用，不存档） */
  events: EventRecord[];
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
