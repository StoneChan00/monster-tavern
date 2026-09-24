import type { MaterialId } from '../engine/types';
import { menuConfig } from './balance';

/**
 * 设施槽位 id。训练场/情报网已从酒馆下架（FACILITIES 不再收录），
 * 但 id 与 state.tavern 字段保留：旧档的既有等级/加成原样生效，仅不可再升级。
 */
export type FacilityId = 'trainingGround' | 'lounge' | 'kitchen' | 'dorm' | 'intel';

export interface UpgradeCost {
  gold: number;
  reputation?: number;
  materials: Partial<Record<MaterialId, number>>;
  /** 需已解锁的菜谱数（厨房菜单扩容门槛） */
  unlockedRecipes?: number;
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

/** 厨房：菜单制（v7）——扩菜单结构（槽位+必需类别）；费用含精英魔核 + 菜谱解锁数门槛 */
export const KITCHEN: FacilityDef = {
  id: 'kitchen',
  name: '厨房',
  icon: '🍳',
  describe: (lv) => {
    const cfg = menuConfig(lv);
    const req = cfg.required.length > 0 ? ` · 需覆盖：${cfg.required.length} 类` : ' · 无结构要求';
    return `菜单 ${cfg.slots} 道${req}`;
  },
  maxLevel: 4,
  cost: (lv) => [
    { gold: 80, materials: { mat_elite_core_1: 2 }, unlockedRecipes: 4 },
    { gold: 200, materials: { mat_elite_core_2: 3 }, unlockedRecipes: 7 },
    { gold: 500, materials: { mat_elite_core_3: 4 }, unlockedRecipes: 10 },
    { gold: 1200, materials: { mat_elite_core_4: 5 }, unlockedRecipes: 14 },
  ][lv],
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
