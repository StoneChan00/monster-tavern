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
  /** 团灭后休整时长（Phase 0 缩短便于验证；正式版 30min） */
  REST_AFTER_WIPE_S: 120,
  /** 波次间休整秒数 */
  WAVE_REST_S: 3,
  /** 清波后按最大生命比例回血 */
  HEAL_ON_WAVE_CLEAR: 0.2,
  /** 升级时按最大生命比例回血 */
  HEAL_ON_LEVEL_UP: 0.25,
  /** 用餐（菜肴生效）获得的忠诚度 */
  LOYALTY_PER_MEAL: 8,
  /** 日志环形缓冲上限 */
  LOG_LIMIT: 60,
  /** 勇者暴击率与倍率（魔物不暴击） */
  CRIT_CHANCE: 0.05,
  CRIT_MULT: 1.5,
  /** 伤害浮动 ±10% */
  DMG_VARIANCE: 0.1,
  /** 自动存档间隔（秒） */
  AUTOSAVE_INTERVAL_S: 30,
} as const;
