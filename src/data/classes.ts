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
  /** 到访冒险者随机名字池 */
  namePool: string[];
}

export const WARRIOR: ClassDef = {
  id: 'warrior',
  name: '战士',
  icon: '⚔️',
  role: '坦克 / 前排',
  preferredRow: 'front',
  combat: 'strike',
  base: { hp: 110, atk: 11, def: 7, spd: 7 },
  perLevel: { hp: 14, atk: 2.5, def: 1.8, spd: 0.4 },
  namePool: ['布洛姆', '葛岩', '铁盾薇拉', '石拳杜姆', '盾娘罗莎', '山岳卡夫'],
};

export const MAGE: ClassDef = {
  id: 'mage',
  name: '法师',
  icon: '🔮',
  role: 'AOE 输出 / 后排',
  preferredRow: 'back',
  combat: 'aoe',
  base: { hp: 70, atk: 16, def: 2, spd: 9 },
  perLevel: { hp: 7, atk: 4, def: 0.5, spd: 0.6 },
  namePool: ['星辉艾拉', '蓝焰莫里斯', '秘典温蒂', '霜语卡莲', '奥术佐兰', '苍穹尼尔'],
};

export const ROGUE: ClassDef = {
  id: 'rogue',
  name: '盗贼',
  icon: '🗡️',
  role: '单体爆发 / 中排',
  preferredRow: 'mid',
  combat: 'assassin',
  base: { hp: 80, atk: 14, def: 3, spd: 13 },
  perLevel: { hp: 8, atk: 3.2, def: 0.8, spd: 1 },
  namePool: ['影刃基德', '夜鸦希娜', '疾风洛平', '毒针薇儿', '灰爪杰洛', '快手菲兹'],
};

export const PRIEST: ClassDef = {
  id: 'priest',
  name: '牧师',
  icon: '✨',
  role: '治疗 / 后排',
  preferredRow: 'back',
  combat: 'heal',
  base: { hp: 85, atk: 12, def: 4, spd: 10 },
  perLevel: { hp: 9, atk: 2.8, def: 1, spd: 0.7 },
  namePool: ['圣光玛尔妲', '晨祷塞恩', '抚伤莉娅', '白烛约瑟', '静修艾登', '慈心歌蒂'],
};

export const RANGER: ClassDef = {
  id: 'ranger',
  name: '游侠',
  icon: '🏹',
  role: '持续物理 / 中排',
  preferredRow: 'mid',
  combat: 'snipe',
  base: { hp: 90, atk: 13, def: 4, spd: 11 },
  perLevel: { hp: 9, atk: 3, def: 1, spd: 0.8 },
  namePool: ['鹰眼塔玛拉', '长弓科尔', '林语菲恩', '追风莱拉', '荒野布兰', '猎痕西格'],
};

export const BARD: ClassDef = {
  id: 'bard',
  name: '吟游诗人',
  icon: '🎵',
  role: '全队增益 / 中排',
  preferredRow: 'mid',
  combat: 'inspire',
  base: { hp: 95, atk: 10, def: 5, spd: 10 },
  perLevel: { hp: 10, atk: 2.2, def: 1.2, spd: 0.5 },
  namePool: ['银弦奥兰', '谣曲温妮', '醉歌巴德', '竖琴伊蕾', '风吟洛可', '旅人艾德温'],
};

export const CLASSES: Record<ClassId, ClassDef> = {
  [WARRIOR.id]: WARRIOR,
  [MAGE.id]: MAGE,
  [ROGUE.id]: ROGUE,
  [PRIEST.id]: PRIEST,
  [RANGER.id]: RANGER,
  [BARD.id]: BARD,
};

/** 开局冒险者 */
export const STARTER_ADVENTURER = {
  id: 'adv_hank',
  name: '铁胃汉克',
  classId: WARRIOR.id,
  rarity: 'common' as const,
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
