import type { MaterialId } from '../engine/types';

/**
 * 设施槽位 id。训练场/情报网已从酒馆下架（FACILITIES 不再收录），
 * 但 id 与 state.tavern 字段保留：旧档的既有等级/加成原样生效，仅不可再升级。
 */
export type FacilityId = 'trainingGround' | 'lounge' | 'kitchen' | 'dorm' | 'intel';

export interface UpgradeCost {
  gold: number;
  reputation?: number;
  materials: Partial<Record<MaterialId, number>>;
}

export interface FacilityDef {
  id: FacilityId;
  name: string;
  icon: string;
  /** 当前等级的效果描述（UI 展示） */
  describe: (level: number) => string;
  maxLevel: number;
  /** 从 level 升到 level+1 的花费 */
  cost: (level: number) => UpgradeCost;
}

/** 招待区：每级 替补席 +1；每 2 级到访批次 +1 */
export const LOUNGE: FacilityDef = {
  id: 'lounge',
  name: '招待区',
  icon: '🪑',
  describe: (lv) => `替补席 ${4 + lv} 人 · 每批到访 ${2 + Math.floor(lv / 2)} 人`,
  maxLevel: 5,
  cost: (lv) => ({
    gold: [80, 200, 500, 1200, 3000][lv],
    materials: { mat_carapace: [4, 8, 14, 22, 32][lv] },
  }),
};

/** 厨房：每级 生效菜肴 +1 道、烹饪速度 +10% */
export const KITCHEN: FacilityDef = {
  id: 'kitchen',
  name: '厨房',
  icon: '🍳',
  describe: (lv) => `同时生效菜肴 ${1 + lv} 道 · 烹饪速度 +${lv * 10}%`,
  maxLevel: 4,
  cost: (lv) => ({
    gold: [60, 150, 400, 1000][lv],
    materials: {
      mat_carapace: [5, 10, 18, 28][lv],
      mat_rock_salt: [2, 4, 8, 14][lv],
    },
  }),
};

/** 宿舍：每级 团灭休整 -10%（下限减半）；3 级起日薪不足不再掉忠诚 */
export const DORM: FacilityDef = {
  id: 'dorm',
  name: '宿舍',
  icon: '🛏️',
  describe: (lv) =>
    `团灭休整 -${Math.min(50, lv * 10)}%${lv >= 3 ? ' · 欠薪不掉忠诚' : ''}`,
  maxLevel: 5,
  cost: (lv) => ({
    gold: [70, 180, 450, 1100, 2600][lv],
    materials: { mat_carapace: [4, 9, 15, 24, 35][lv] },
  }),
};

/** 在营设施注册表（酒馆页签展示 + 升级入口）。
 *  已下架：训练场（训练场加成仍按 state.tavern.trainingGround 生效于旧档）、情报网。 */
export const FACILITIES: Partial<Record<FacilityId, FacilityDef>> = {
  lounge: LOUNGE,
  kitchen: KITCHEN,
  dorm: DORM,
};
