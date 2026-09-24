/** 全局平衡常数 —— 数值调整只改这里，不碰引擎逻辑 */
import type { ClassId, MaterialId } from '../engine/types';
import type { RecipeCategory } from './recipes';

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
  /** 首次团灭应急资助：金币 + 签约材料（初期难度缓冲，仅一次；同时立即刷新一批到访） */
  WIPE_SUBSIDY_GOLD: 200,
  /** 资助附带的签约材料（覆盖 Lv1~2 访客的签约需求） */
  WIPE_SUBSIDY_MATERIALS: { mat_carapace: 4 },
  /** 波次间休整秒数 */
  WAVE_REST_S: 3,
  /** 每波出精英怪的概率（原生 BOSS 作为精英：多种精英、职业徽记掉落） */
  ELITE_CHANCE: 0.05,
  /** 普通波魔物数量区间 */
  WAVE_SIZE_MIN: 2,
  WAVE_SIZE_MAX: 4,
  /** 精英波附带的护卫数量区间 */
  ELITE_GUARD_MIN: 1,
  ELITE_GUARD_MAX: 2,
  /** 清波后按最大生命比例回血（存活者） */
  HEAL_ON_WAVE_CLEAR: 0.2,
  /** 清波后阵亡者按最大生命比例复活 */
  REVIVE_ON_WAVE_CLEAR: 0.3,
  /** 升级仪式完成时按最大生命比例回血 */
  HEAL_ON_LEVEL_UP: 0.25,
  /** 用餐（菜肴生效）获得的忠诚度 */
  LOYALTY_PER_MEAL: 8,
  /** 每小时菜单供给周期：全员忠诚回复 */
  MENU_LOYALTY_PER_CYCLE: 3,
  /** 日薪结算时若无供给菜肴：全队忠诚度下降 */
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

  // ── 厨房菜单（v7：设置制 + 每小时消耗） ──
  /** 菜单供给周期（毫秒，模拟时钟） */
  MENU_CYCLE_MS: 3_600_000,

  // ── 经济（D&D 等级制） ───────────────
  DAY_MS: 86_400_000,

  /** 玩家可手动升级的上限（9、10 级仪式暂未开放，只能靠稀有访客） */
  UPGRADE_CAP: 8,
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

/** 职业徽记材料 id（精英掉落 → 对应职业的升级仪式） */
export const SIGIL_OF: Record<ClassId, MaterialId> = {
  warrior: 'mat_sigil_warrior',
  mage: 'mat_sigil_mage',
  rogue: 'mat_sigil_rogue',
  priest: 'mat_sigil_priest',
  ranger: 'mat_sigil_ranger',
  bard: 'mat_sigil_bard',
};

/** 精英魔核材料 id（图 1-6 → 升到 3-8 级的门槛；图 6 的结晶为 9-10 级预留） */
export const ELITE_CORE_OF: Record<number, MaterialId> = {
  1: 'mat_elite_core_1',
  2: 'mat_elite_core_2',
  3: 'mat_elite_core_3',
  4: 'mat_elite_core_4',
  5: 'mat_elite_core_5',
  6: 'mat_elite_core_6',
};

export interface LevelUpCostDef {
  gold: number;
  materials: Partial<Record<MaterialId, number>>;
}

/**
 * D&D 升级仪式费用（经验攒满后仍需支付）：
 * - 升到 2、3 级：普通魔物掉落（凝胶/甲壳）
 * - 升到 3~8 级：职业徽记（对应职业精英掉落）+ 对应图的精英魔核（图1→3级 … 图6→8级）
 * - 9、10 级：暂未开放（返回 null），只能通过稀有访客获得高等级冒险者
 * 索引 = 目标等级（costOfLevel(2) = Lv1→2 的费用）。
 */
export function levelUpCost(targetLevel: number, classId: ClassId): LevelUpCostDef | null {
  const sigil = SIGIL_OF[classId];
  switch (targetLevel) {
    case 2:
      return { gold: 80, materials: { mat_gel: 10 } };
    case 3:
      return { gold: 150, materials: { mat_carapace: 8 } };
    case 4:
      return { gold: 300, materials: { [sigil]: 1, mat_elite_core_1: 3 } };
    case 5:
      return { gold: 600, materials: { [sigil]: 1, mat_elite_core_2: 4 } };
    case 6:
      return { gold: 1000, materials: { [sigil]: 2, mat_elite_core_3: 5 } };
    case 7:
      return { gold: 1600, materials: { [sigil]: 2, mat_elite_core_4: 6 } };
    case 8:
      return { gold: 2500, materials: { [sigil]: 3, mat_elite_core_5: 7 } };
    default:
      return null; // 9、10 级仪式暂未开放
  }
}

/**
 * 厨房菜单结构：等级 → 槽位数 + 必需类别 + 结构加成。
 * 菜品效果随供料独立生效（无门控）；满足某级结构类别要求 → 该级结构加成生效。
 * 类别要求累进（高级结构 ⊇ 低级），满足高级结构自动满足低级，**效果叠加**——
 * 因此 4 级厨房 7 槽可同时触发 1-4 级全部结构加成；只摆 5 道满足 3 级结构时，
 * 1/2/3 级加成同样全部生效。
 */
export interface MenuBonus {
  /** 套餐名（UI 展示） */
  name: string;
  desc: string;
  /** 全属性乘区（如 1.05 = +5%） */
  statMult?: number;
  /** 经验获取乘区 */
  expMult?: number;
  /** 掉落率乘区 */
  dropMult?: number;
  /** 每次供给周期的额外忠诚回复（全员） */
  loyaltyBonus?: number;
}

export interface MenuConfig {
  slots: number;
  required: RecipeCategory[];
  bonus: MenuBonus;
}

export const MENU_CONFIG: Record<number, MenuConfig> = {
  0: { slots: 2, required: [], bonus: { name: '', desc: '任意 2 道菜即可，结构加成待厨房升级解锁' } },
  1: {
    slots: 3,
    required: ['appetizer', 'main', 'drink'],
    bonus: { name: '温饱套餐', desc: '每次供给全员忠诚 +2', loyaltyBonus: 2 },
  },
  2: {
    slots: 4,
    required: ['appetizer', 'side', 'main', 'drink'],
    bonus: { name: '丰盛套餐', desc: '全队属性 +5%', statMult: 1.05 },
  },
  3: {
    slots: 5,
    required: ['appetizer', 'soup', 'side', 'main', 'drink'],
    bonus: { name: '盛宴', desc: '经验获取 +8%', expMult: 1.08 },
  },
  4: {
    slots: 7,
    required: ['appetizer', 'soup', 'side', 'main', 'salad', 'dessert', 'drink'],
    bonus: { name: '满汉全席', desc: '掉落率 +10%', dropMult: 1.1 },
  },
};

export function menuConfig(kitchenLevel: number): MenuConfig {
  return MENU_CONFIG[Math.max(0, Math.min(4, kitchenLevel))];
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
