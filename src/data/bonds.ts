import type { ClassId } from '../engine/types';

/** 编队羁绊：满足职业组合条件即生效的小队增益 */
export interface BondDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  check: (classes: ClassId[]) => boolean;
  effect: { stat: 'atk' | 'def' | 'dropRate'; mult: number };
}

export const BONDS: BondDef[] = [
  {
    id: 'bond_fortress',
    name: '坚守',
    icon: '🛡️',
    desc: '队伍同时有战士与牧师：全队 DEF +10%',
    check: (cs) => cs.includes('warrior') && cs.includes('priest'),
    effect: { stat: 'def', mult: 1.1 },
  },
  {
    id: 'bond_barrage',
    name: '火力全开',
    icon: '💥',
    desc: '队伍同时有法师与游侠：全队 ATK +10%',
    check: (cs) => cs.includes('mage') && cs.includes('ranger'),
    effect: { stat: 'atk', mult: 1.1 },
  },
  {
    id: 'bond_motley',
    name: '杂牌军',
    icon: '🎲',
    desc: '队伍职业数 ≥ 3 种：掉落率 +8%',
    check: (cs) => new Set(cs).size >= 3,
    effect: { stat: 'dropRate', mult: 1.08 },
  },
];

/** 当前编队（存活成员职业列表）激活的羁绊 */
export function activeBonds(partyClassIds: ClassId[]): BondDef[] {
  return BONDS.filter((b) => b.check(partyClassIds));
}
