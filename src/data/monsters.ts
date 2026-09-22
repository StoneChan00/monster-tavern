import type { BaseStats, FloorId, MaterialId, MonsterId } from '../engine/types';

export interface MonsterDef {
  id: MonsterId;
  name: string;
  icon: string;
  base: BaseStats;
  exp: number;
  gold: number;
  /** 加权掉落表（每次击杀按权重随机一条；单条 = 保底掉落） */
  drops: Array<{ materialId: MaterialId; count: number; weight: number }>;
}

const SLIME: MonsterDef = {
  id: 'slime',
  name: '苔原史莱姆',
  icon: '🟢',
  base: { hp: 30, atk: 6, def: 2, spd: 5 },
  exp: 8,
  gold: 3,
  drops: [{ materialId: 'mat_gel', count: 1, weight: 10 }],
};

const BAT: MonsterDef = {
  id: 'bat',
  name: '洞穴蝙蝠',
  icon: '🦇',
  base: { hp: 22, atk: 8, def: 1, spd: 12 },
  exp: 9,
  gold: 4,
  drops: [
    { materialId: 'mat_gel', count: 1, weight: 5 },
    { materialId: 'mat_carapace', count: 1, weight: 2 },
  ],
};

const MUSHROOM: MonsterDef = {
  id: 'mushroom',
  name: '咆哮蘑菇',
  icon: '🍄',
  base: { hp: 40, atk: 5, def: 6, spd: 3 },
  exp: 12,
  gold: 5,
  drops: [{ materialId: 'mat_carapace', count: 1, weight: 8 }],
};

const SLIME_KING: MonsterDef = {
  id: 'slime_king',
  name: '史莱姆之王',
  icon: '👑',
  base: { hp: 150, atk: 10, def: 4, spd: 4 },
  exp: 40,
  gold: 25,
  drops: [
    { materialId: 'mat_gel', count: 3, weight: 10 },
    { materialId: 'mat_carapace', count: 1, weight: 5 },
  ],
};

export const MONSTERS: Record<MonsterId, MonsterDef> = {
  [SLIME.id]: SLIME,
  [BAT.id]: BAT,
  [MUSHROOM.id]: MUSHROOM,
  [SLIME_KING.id]: SLIME_KING,
};

export interface WaveDef {
  monsters: MonsterId[];
  isBoss?: boolean;
}

export interface FloorDef {
  id: FloorId;
  name: string;
  icon: string;
  waves: WaveDef[];
  /** 首杀层底 BOSS 获得的声望 */
  firstClearReputation: number;
}

/** Phase 0 唯一地牢：苔藓洞窟 第 1 层（5 波，波底 BOSS） */
export const FLOOR_MOSSY_CAVERN: FloorDef = {
  id: 'floor_mossy',
  name: '苔藓洞窟 · 第 1 层',
  icon: '🕳️',
  waves: [
    { monsters: ['slime', 'slime'] },
    { monsters: ['slime', 'slime', 'bat'] },
    { monsters: ['bat', 'bat', 'mushroom'] },
    { monsters: ['mushroom', 'mushroom', 'slime', 'slime'] },
    { monsters: ['slime_king'], isBoss: true },
  ],
  firstClearReputation: 5,
};

export const FLOORS: Record<FloorId, FloorDef> = {
  [FLOOR_MOSSY_CAVERN.id]: FLOOR_MOSSY_CAVERN,
};
