/** 全局平衡常数 —— 数值调整只改这里，不碰引擎逻辑 */
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
  /** 波次间休整秒数 */
  WAVE_REST_S: 3,
  /** 清波后按最大生命比例回血（存活者） */
  HEAL_ON_WAVE_CLEAR: 0.2,
  /** 清波后阵亡者按最大生命比例复活 */
  REVIVE_ON_WAVE_CLEAR: 0.3,
  /** 升级时按最大生命比例回血 */
  HEAL_ON_LEVEL_UP: 0.25,
  /** 用餐（菜肴生效）获得的忠诚度 */
  LOYALTY_PER_MEAL: 8,
  /** 日薪结算时若无生效菜肴：全队忠诚度下降 */
  LOYALTY_DECAY_NO_BUFF: 2,
  /** 忠诚度满值时的属性加成上限（+15%） */
  LOYALTY_STAT_BONUS: 0.15,
  /** 日志环形缓冲上限 */
  LOG_LIMIT: 80,
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

  // ── 经济 ─────────────────────────────
  /** 每日日薪（按稀有度：普通/优秀/稀有/史诗/传说） */
  WAGE_PER_RARITY: [5, 15, 40, 120, 350],
  /** 签约金币（按稀有度） */
  SIGN_COST_GOLD: [50, 150, 400, 1200, 3500],
  DAY_MS: 86_400_000,
} as const;

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
  | { type: 'floorClear'; floor: number }
  | { type: 'reputation'; value: number };
