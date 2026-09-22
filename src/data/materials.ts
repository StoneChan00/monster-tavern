import type { MaterialId } from '../engine/types';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  icon: string;
  kind: 'food' | 'build';
  desc: string;
}

/** 食材：烹饪 */
export const MAT_GEL: MaterialDef = {
  id: 'mat_gel',
  name: '魔物凝胶',
  icon: '🧪',
  kind: 'food',
  desc: '黏糊糊，据说高蛋白。烹饪的基础食材。',
};

/** 基建材料：酒馆升级 */
export const MAT_CARAPACE: MaterialDef = {
  id: 'mat_carapace',
  name: '魔物甲壳',
  icon: '🛡️',
  kind: 'build',
  desc: '坚硬的魔物外壳。酒馆设施升级材料。',
};

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  [MAT_GEL.id]: MAT_GEL,
  [MAT_CARAPACE.id]: MAT_CARAPACE,
};
