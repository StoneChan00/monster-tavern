import type { MaterialId } from '../engine/types';

export interface UpgradeCost {
  gold: number;
  materials: Partial<Record<MaterialId, number>>;
}

export interface FacilityDef {
  id: string;
  name: string;
  icon: string;
  /** 当前等级的效果描述（用于 UI 展示） */
  describe: (level: number) => string;
  maxLevel: number;
  /** 从 level 升到 level+1 的花费 */
  cost: (level: number) => UpgradeCost;
}

/** 训练场：每级 冒险者等级上限 +5、全属性 +8% */
export const TRAINING_GROUND: FacilityDef = {
  id: 'training_ground',
  name: '训练场',
  icon: '🏹',
  describe: (lv) => `冒险者等级上限 ${10 + lv * 5} · 全属性 +${lv * 8}%`,
  maxLevel: 5,
  cost: (lv) => ({
    gold: [50, 120, 300, 750, 1800][lv],
    materials: { mat_carapace: [3, 6, 10, 15, 21][lv] },
  }),
};

export const FACILITIES = {
  trainingGround: TRAINING_GROUND,
} as const;
