import type { MaterialId } from '../engine/types';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  icon: string;
  kind: 'food' | 'build';
  /** 稀有度挡位（签约/升级消耗展示用） */
  tier: number;
  desc: string;
}

export const MAT_GEL: MaterialDef = {
  id: 'mat_gel',
  name: '魔物凝胶',
  icon: '🧪',
  kind: 'food',
  tier: 1,
  desc: '黏糊糊，据说高蛋白。烹饪的基础食材。',
};

export const MAT_CARAPACE: MaterialDef = {
  id: 'mat_carapace',
  name: '魔物甲壳',
  icon: '🛡️',
  kind: 'build',
  tier: 1,
  desc: '坚硬的魔物外壳。酒馆设施升级材料。',
};

export const MAT_BAT_WING: MaterialDef = {
  id: 'mat_bat_wing',
  name: '蝙蝠之翼',
  icon: '🦇',
  kind: 'food',
  tier: 1,
  desc: '肉质紧实的翼膜，烧烤摊的灵魂。',
};

export const MAT_ROCK_SALT: MaterialDef = {
  id: 'mat_rock_salt',
  name: '洞窟岩盐',
  icon: '🧂',
  kind: 'food',
  tier: 2,
  desc: '地底沉积的矿物盐，提味神器。',
};

export const MAT_MITHRIL: MaterialDef = {
  id: 'mat_mithril',
  name: '秘银碎片',
  icon: '💎',
  kind: 'build',
  tier: 2,
  desc: '微光流转的稀有金属。高级设施升级材料。',
};

export const MAT_CORE: MaterialDef = {
  id: 'mat_core',
  name: '深渊魔核',
  icon: '🟣',
  kind: 'build',
  tier: 3,
  desc: '魔物力量的结晶。传说菜肴与顶级签约的硬通货。',
};

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  [MAT_GEL.id]: MAT_GEL,
  [MAT_CARAPACE.id]: MAT_CARAPACE,
  [MAT_BAT_WING.id]: MAT_BAT_WING,
  [MAT_ROCK_SALT.id]: MAT_ROCK_SALT,
  [MAT_MITHRIL.id]: MAT_MITHRIL,
  [MAT_CORE.id]: MAT_CORE,
};
