/** 全局平衡常数 —— 数值调整只改这里，不碰引擎逻辑 */
import type { MaterialId } from '../engine/types';

export const BALANCE = {
  /** 模拟步长（秒）。战斗 1 tick = 1 回合 */
  TICK_S: 1,
  /** 离线收益上限（秒）：初始 8 小时 */
  OFFLINE_CAP_S: 8 * 3600,
  /** 离线效率：保证在线永远优于离线 */
  OFFLINE_EFFICIENCY: 0.6,
  /** 超过该秒数的页面空白（切页签/离线）走离线补算并提示 */
  WELCOME_BACK_THRESHOLD_S: 120,
  /** 团灭后休整时长（宿舍每级 -10%，下限 50%） */
  REST_AFTER_WIPE_S: 120,
  /** 首次团灭应急资助：金币 + 签约材料（初期难度缓冲，仅一次） */
  WIPE_SUBSIDY_GOLD: 200,
  /** 资助附带的签约材料（覆盖 Lv1~2 访客的签约需求） */
  WIPE_SUBSIDY_MATERIALS: { mat_carapace: 4 },
  /** 资助时若无客到访：最迟多少毫秒内安排一批（保证引导可完成） */
  WIPE_SUBSIDY_VISIT_DELAY_MS: 60_000,
  /** 波次间休整秒数 */
  WAVE_REST_S: 3,
  /** 每波出 BOSS 的概率（纯随机；期望约 20 波一遇） */
  BOSS_CHANCE: 0.05,
  /** 普通波魔物数量区间 */
  WAVE_SIZE_MIN: 2,
  WAVE_SIZE_MAX: 4,
  /** BOSS 波附带的护卫数量区间 */
  BOSS_GUARD_MIN: 1,
  BOSS_GUARD_MAX: 2,
  /** 清波后按最大生命比例回血（存活者） */
  HEAL_ON_WAVE_CLEAR: 0.2,
  /** 清波后阵亡者按最大生命比例复活 */
  REVIVE_ON_WAVE_CLEAR: 0.3,
  /** 升级仪式完成时按最大生命比例回血 */
  HEAL_ON_LEVEL_UP: 0.25,
  /** 用餐（菜肴生效）获得的忠诚度 */
  LOYALTY_PER_MEAL: 8,
  /** 日薪结算时若无生效菜肴：全队忠诚度下降 */
  LOYALTY_DECAY_NO_BUFF: 2,
  /** 忠诚度满值时的属性加成上限（+15%） */
  LOYALTY_STAT_BONUS: 0.15,
  /** 日志环形缓冲上限 */
  LOG_LIMIT: 80,
  /** 事件流环形缓冲上限（战斗视口回放） */
  EVENT_LIMIT: 150,
  /** 勇者（非盗贼）暴击率与倍率 */
  CRIT_CHANCE: 0.05,
  CRIT_MULT: 1.5,
  /** 伤害浮动 ±10% */
  DMG_VARIANCE: 0.1,
  /** 自动存档间隔（秒） */
  AUTOSAVE_INTERVAL_S: 30,

  // ── 编队 ─────────────────────────────
  PARTY_SIZE: 5,
  /** 槽位站位：索引 = 槽位号。0/3 前排，1/4 中排，2 后排 */
  SLOT_ROWS: ['front', 'mid', 'back', 'front', 'mid'] as const,
  /** 槽位解锁所需声望（0 = 初始解锁） */
  SLOT_UNLOCK_REP: [0, 0, 0, 20, 50],
  /** 初始替补席上限；+ 招待区等级 */
  BASE_ROSTER_CAP: 4,

  // ── 招募到访 ─────────────────────────
  /** 到访批次间隔（秒） */
  VISIT_INTERVAL_S: 2 * 3600,
  /** 每批基础人数；+ floor(招待区/2) */
  VISIT_BATCH_BASE: 2,

  // ── 经济（D&D 等级制） ───────────────
  DAY_MS: 86_400_000,
} as const;

/** 日薪 = 2 × 等级²（Lv1=2，Lv5=50，Lv10=200） */
export function wageOfLevel(level: number): number {
  return 2 * level * level;
}

/** 签约金币 = 30 × 等级²（Lv1=30，Lv5=750，Lv10=3000） */
export function signCostOfLevel(level: number): number {
  return 30 * level * level;
}

/** 签约基准材料（按等级分档，高等级雇佣 = 硬通货） */
export function signMaterialOfLevel(level: number): { materialId: MaterialId; count: number } {
  if (level <= 3) return { materialId: 'mat_carapace', count: 2 + level };
  if (level <= 6) return { materialId: 'mat_mithril', count: level - 2 };
  if (level <= 8) return { materialId: 'mat_core', count: level - 5 };
  return { materialId: 'mat_core', count: level - 6 };
}

/**
 * 到访冒险者的等级权重（Lv1~10）。
 * 高等级极稀有（D&D 风味：高等级人物整个世界屈指可数）；
 * 声望每点给高等级温和加权，但不改变量级。
 */
export function visitorLevelWeights(reputation: number): number[] {
  const base = [30, 24, 17, 11, 7, 4, 2, 0.9, 0.35, 0.12];
  return base.map((w, i) => w * (1 + reputation * 0.004 * i));
}

/**
 * 升级仪式费用（经验攒满后仍需支付：金币 + 材料）。
 * 索引 = 当前等级 - 1（即 [0] = Lv1→2 的费用）。
 */
export const LEVEL_UP_COST: Array<{ gold: number; materials: Partial<Record<MaterialId, number>> }> = [
  { gold: 80, materials: { mat_gel: 10 } },
  { gold: 150, materials: { mat_carapace: 8 } },
  { gold: 300, materials: { mat_mushroom_cap: 10 } },
  { gold: 600, materials: { mat_mithril: 3 } },
  { gold: 1000, materials: { mat_mithril: 6 } },
  { gold: 1600, materials: { mat_core: 2 } },
  { gold: 2500, materials: { mat_core: 3, mat_mithril: 8 } },
  { gold: 4000, materials: { mat_void_essence: 3 } },
  { gold: 6500, materials: { mat_void_essence: 6, mat_core: 5 } },
];

/** 生效中的同属性菜肴 buff 上限 = 1 + 厨房等级（0~4 → 1~5 道） */
export function kitchenBuffSlots(kitchenLevel: number): number {
  return 1 + kitchenLevel;
}

/** 烹饪速度倍率 = 1 + 0.1 × 厨房等级 */
export function kitchenSpeedMult(kitchenLevel: number): number {
  return 1 + 0.1 * kitchenLevel;
}

/** 休整时长倍率 = 1 - 0.1 × 宿舍等级（下限 0.5） */
export function dormRestMult(dormLevel: number): number {
  return Math.max(0.5, 1 - 0.1 * dormLevel);
}

/** 替补席上限 = 基础 + 招待区等级 */
export function rosterCap(loungeLevel: number): number {
  return BALANCE.BASE_ROSTER_CAP + loungeLevel;
}

/** 每批到访人数 = 基础 + floor(招待区/2) */
export function visitBatchSize(loungeLevel: number): number {
  return BALANCE.VISIT_BATCH_BASE + Math.floor(loungeLevel / 2);
}

/** 菜谱解锁条件（数据文件中声明，引擎统一判定） */
export type RecipeUnlock =
  | { type: 'initial' }
  | { type: 'mapClear'; map: number }
  | { type: 'reputation'; value: number };
