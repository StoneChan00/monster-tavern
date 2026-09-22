import type { BaseStats, ClassId } from '../engine/types';

export interface ClassDef {
  id: ClassId;
  name: string;
  icon: string;
  role: string;
  base: BaseStats;
  perLevel: BaseStats;
}

/** Phase 0 唯一职业：战士 */
export const WARRIOR: ClassDef = {
  id: 'warrior',
  name: '战士',
  icon: '⚔️',
  role: '坦克 / 前排',
  base: { hp: 100, atk: 12, def: 5, spd: 8 },
  perLevel: { hp: 12, atk: 3, def: 1.5, spd: 0.5 },
};

export const CLASSES: Record<ClassId, ClassDef> = {
  [WARRIOR.id]: WARRIOR,
};

/** 开局冒险者 */
export const STARTER_ADVENTURER = {
  id: 'adv_hank',
  name: '铁胃汉克',
  classId: WARRIOR.id,
  rarity: 'common' as const,
};
