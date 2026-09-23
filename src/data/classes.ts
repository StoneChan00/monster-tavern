import type { BaseStats, ClassId, CombatStyle } from '../engine/types';

export interface ClassDef {
  id: ClassId;
  name: string;
  icon: string;
  role: string;
  /** 建议站位（UI 提示用，不强制） */
  preferredRow: 'front' | 'mid' | 'back';
  /** 战斗行为 */
  combat: CombatStyle;
  base: BaseStats;
  perLevel: BaseStats;
}

/**
 * perLevel 曲线按 10 级封顶标定（Lv10 ≈ 原 35 级满级强度）：
 * D&D 制下 1 级学徒与 10 级传奇差距悬殊；经验攒得快，升级仪式贵。
 */
export const WARRIOR: ClassDef = {
  id: 'warrior',
  name: '战士',
  icon: '⚔️',
  role: '坦克 / 前排',
  preferredRow: 'front',
  combat: 'strike',
  base: { hp: 110, atk: 11, def: 7, spd: 7 },
  perLevel: { hp: 49, atk: 8.75, def: 6.3, spd: 0.6 },
};

export const MAGE: ClassDef = {
  id: 'mage',
  name: '法师',
  icon: '🔮',
  role: 'AOE 输出 / 后排',
  preferredRow: 'back',
  combat: 'aoe',
  base: { hp: 70, atk: 16, def: 2, spd: 9 },
  perLevel: { hp: 24.5, atk: 14, def: 1.75, spd: 0.9 },
};

export const ROGUE: ClassDef = {
  id: 'rogue',
  name: '盗贼',
  icon: '🗡️',
  role: '单体爆发 / 中排',
  preferredRow: 'mid',
  combat: 'assassin',
  base: { hp: 80, atk: 14, def: 3, spd: 13 },
  perLevel: { hp: 28, atk: 11.2, def: 2.8, spd: 1.5 },
};

export const PRIEST: ClassDef = {
  id: 'priest',
  name: '牧师',
  icon: '✨',
  role: '治疗 / 后排',
  preferredRow: 'back',
  combat: 'heal',
  base: { hp: 85, atk: 12, def: 4, spd: 10 },
  perLevel: { hp: 31.5, atk: 9.8, def: 3.5, spd: 1.05 },
};

export const RANGER: ClassDef = {
  id: 'ranger',
  name: '游侠',
  icon: '🏹',
  role: '持续物理 / 中排',
  preferredRow: 'mid',
  combat: 'snipe',
  base: { hp: 90, atk: 13, def: 4, spd: 11 },
  perLevel: { hp: 31.5, atk: 10.5, def: 3.5, spd: 1.2 },
};

export const BARD: ClassDef = {
  id: 'bard',
  name: '吟游诗人',
  icon: '🎵',
  role: '全队增益 / 中排',
  preferredRow: 'mid',
  combat: 'inspire',
  base: { hp: 95, atk: 10, def: 5, spd: 10 },
  perLevel: { hp: 35, atk: 7.7, def: 4.2, spd: 0.75 },
};

export const CLASSES: Record<ClassId, ClassDef> = {
  [WARRIOR.id]: WARRIOR,
  [MAGE.id]: MAGE,
  [ROGUE.id]: ROGUE,
  [PRIEST.id]: PRIEST,
  [RANGER.id]: RANGER,
  [BARD.id]: BARD,
};

/** 开局冒险者（Lv1 学徒战士） */
export const STARTER_ADVENTURER = {
  id: 'adv_hank',
  name: '铁胃汉克',
  classId: WARRIOR.id,
  race: 'human' as const,
};

/** 盗贼专属暴击参数 */
export const ROGUE_CRIT = { chance: 0.25, mult: 2 } as const;
/** 吟游诗人光环：队伍中有诗人时全队 ATK +10% */
export const BARD_AURA = { stat: 'atk', mult: 1.1 } as const;
/** 法师 AOE：对全体存活魔物造成 60% ATK */
export const MAGE_AOE_RATIO = 0.6;
/** 牧师治疗量 = ATK × 1.6；全员满血时以 50% ATK 普攻 */
export const PRIEST_HEAL_RATIO = 1.6;
export const PRIEST_IDLE_ATTACK_RATIO = 0.5;
