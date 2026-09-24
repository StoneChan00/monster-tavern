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

/**
 * 材料体系（迷宫饭式：食材 = 魔物部位，建材 = 矿物/甲壳）。
 * 食材按"解剖学"对应魔物：史莱姆出凝胶、蝙蝠出翼膜、蘑菇出菌伞……
 */

// ── 食材（12 + 2 深层） ─────────────────────────────
export const MAT_GEL: MaterialDef = {
  id: 'mat_gel',
  name: '魔物凝胶',
  icon: '🧪',
  kind: 'food',
  tier: 1,
  desc: '史莱姆类的基础成分。去除杂质后弹滑暖胃，万菜之基。',
};
export const MAT_BAT_WING: MaterialDef = {
  id: 'mat_bat_wing',
  name: '蝙蝠之翼',
  icon: '🦇',
  kind: 'food',
  tier: 1,
  desc: '翼膜紧实有嚼劲，炭火一烤便是洞穴名物。',
};
export const MAT_MUSHROOM_CAP: MaterialDef = {
  id: 'mat_mushroom_cap',
  name: '巨型菌伞',
  icon: '🍄',
  kind: 'food',
  tier: 1,
  desc: '咆哮蘑菇的伞盖。鲜味浓郁，炖汤的灵魂。',
};
export const MAT_ROCK_SALT: MaterialDef = {
  id: 'mat_rock_salt',
  name: '洞窟岩盐',
  icon: '🧂',
  kind: 'food',
  tier: 2,
  desc: '地底沉积的矿物盐。几乎所有魔物料理的最后一步。',
};
export const MAT_CRAB_CLAW: MaterialDef = {
  id: 'mat_crab_claw',
  name: '岩壳蟹钳',
  icon: '🦀',
  kind: 'food',
  tier: 2,
  desc: '岩壳蟹的巨螯，壳脆肉丰，炸制后连壳都能嚼。',
};
export const MAT_WOLF_MEAT: MaterialDef = {
  id: 'mat_wolf_meat',
  name: '苔藓狼肉',
  icon: '🍖',
  kind: 'food',
  tier: 2,
  desc: '带一丝苔藓清香的瘦肉，久炖不柴。',
};
export const MAT_LIZARD_TAIL: MaterialDef = {
  id: 'mat_lizard_tail',
  name: '蜥蜴尾',
  icon: '🦎',
  kind: 'food',
  tier: 2,
  desc: '穴居蜥蜴的尾巴，胶质丰厚，辛香锅的主角。',
};
export const MAT_JELLY_TENTACLE: MaterialDef = {
  id: 'mat_jelly_tentacle',
  name: '水母触腕',
  icon: '🪼',
  kind: 'food',
  tier: 2,
  desc: '幽光水母的触腕，自带微光，凉拌如水晶。',
};
export const MAT_FLOWER_HONEY: MaterialDef = {
  id: 'mat_flower_honey',
  name: '食人花蜜',
  icon: '🍯',
  kind: 'food',
  tier: 3,
  desc: '从食人花囊中取出的蜜。甜得危险，采集需签生死状。',
};
export const MAT_TROLL_STEAK: MaterialDef = {
  id: 'mat_troll_steak',
  name: '巨魔肉排',
  icon: '🥩',
  kind: 'food',
  tier: 3,
  desc: '巨魔的背脊肉，据说吃下后伤口愈合得更快。',
};
export const MAT_WRAITH_ESSENCE: MaterialDef = {
  id: 'mat_wraith_essence',
  name: '幽魂残息',
  icon: '👻',
  kind: 'food',
  tier: 3,
  desc: '幽魂消散前的最后一缕执念。入口冰凉，回味是别人的记忆。',
};
export const MAT_ABYSS_TENTACLE: MaterialDef = {
  id: 'mat_abyss_tentacle',
  name: '深渊触腕',
  icon: '🐙',
  kind: 'food',
  tier: 3,
  desc: '深渊触手的最嫩一截。口感玄妙，如同吞下一小片夜色。',
};
export const MAT_CRYSTAL_JELLY: MaterialDef = {
  id: 'mat_crystal_jelly',
  name: '晶核冻',
  icon: '💠',
  kind: 'food',
  tier: 3,
  desc: '晶核史莱姆体内析出的半透明晶冻，咬破时有一声清脆的"啵"。',
};
export const MAT_VOID_ESSENCE: MaterialDef = {
  id: 'mat_void_essence',
  name: '虚空精华',
  icon: '🌌',
  kind: 'food',
  tier: 3,
  desc: '虚空魔物凝结的暗色结晶。料理得当便是珍馐，不当便是毒药。',
};

// ── 建材（3） ───────────────────────────────────────
export const MAT_CARAPACE: MaterialDef = {
  id: 'mat_carapace',
  name: '魔物甲壳',
  icon: '🛡️',
  kind: 'build',
  tier: 1,
  desc: '坚硬的魔物外壳。酒馆设施升级材料。',
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

// ── 精英魔核（6 档，对应图 1-6；升级仪式 3-8 级的地图门槛） ──
export const MAT_ELITE_CORE_1: MaterialDef = {
  id: 'mat_elite_core_1',
  name: '苔藓古树心',
  icon: '🟢',
  kind: 'build',
  tier: 2,
  desc: '苔藓洞窟精英体内凝结的翠色核心，散发着原始生命力。',
};
export const MAT_ELITE_CORE_2: MaterialDef = {
  id: 'mat_elite_core_2',
  name: '秘银星髓',
  icon: '🔵',
  kind: 'build',
  tier: 3,
  desc: '秘银矿道精英吞噬矿脉后析出的星辉髓块。',
};
export const MAT_ELITE_CORE_3: MaterialDef = {
  id: 'mat_elite_core_3',
  name: '骸骨圣灰',
  icon: '🟤',
  kind: 'build',
  tier: 4,
  desc: '骸骨墓穴精英火化后留下的圣灰，沉重得不像骨灰。',
};
export const MAT_ELITE_CORE_4: MaterialDef = {
  id: 'mat_elite_core_4',
  name: '熔火之核',
  icon: '🔴',
  kind: 'build',
  tier: 5,
  desc: '熔岩裂隙精英胸腔里取出的不灭火种，握久了会烫伤灵魂。',
};
export const MAT_ELITE_CORE_5: MaterialDef = {
  id: 'mat_elite_core_5',
  name: '晶簇之心',
  icon: '🔷',
  kind: 'build',
  tier: 6,
  desc: '水晶回廊精英亿万年凝结的心脏，敲击时整条回廊都会共鸣。',
};
export const MAT_ELITE_CORE_6: MaterialDef = {
  id: 'mat_elite_core_6',
  name: '虚空结晶',
  icon: '🟣',
  kind: 'build',
  tier: 7,
  desc: '虚空终焉精英坍缩成的完美结晶。9、10 级仪式暂未开放，先替你收着。',
};

// ── 职业徽记（6 种，职业对应精英掉落；升级仪式硬通货） ──
export const MAT_SIGIL_WARRIOR: MaterialDef = {
  id: 'mat_sigil_warrior',
  name: '战者徽记',
  icon: '⚔️',
  kind: 'build',
  tier: 3,
  desc: '战士系精英的荣誉徽记。凑齐它，战士的升级仪式才有分量。',
};
export const MAT_SIGIL_MAGE: MaterialDef = {
  id: 'mat_sigil_mage',
  name: '奥术徽记',
  icon: '🔮',
  kind: 'build',
  tier: 3,
  desc: '法师系精英的浮空徽记，表面流转着微型法阵。',
};
export const MAT_SIGIL_ROGUE: MaterialDef = {
  id: 'mat_sigil_rogue',
  name: '暗影徽记',
  icon: '🗡️',
  kind: 'build',
  tier: 3,
  desc: '盗贼系精英的徽记，只在光熄灭的一瞬显形。',
};
export const MAT_SIGIL_PRIEST: MaterialDef = {
  id: 'mat_sigil_priest',
  name: '圣光徽记',
  icon: '✨',
  kind: 'build',
  tier: 3,
  desc: '牧师系精英的徽记，靠近时能听见遥远的圣歌。',
};
export const MAT_SIGIL_RANGER: MaterialDef = {
  id: 'mat_sigil_ranger',
  name: '猎手徽记',
  icon: '🏹',
  kind: 'build',
  tier: 3,
  desc: '游侠系精英的徽记，边缘刻着猎物的足迹。',
};
export const MAT_SIGIL_BARD: MaterialDef = {
  id: 'mat_sigil_bard',
  name: '诗心徽记',
  icon: '🎻',
  kind: 'build',
  tier: 3,
  desc: '吟游诗人系精英的徽记，贴在耳边能听见未写完的歌。',
};

export const MATERIALS: Record<MaterialId, MaterialDef> = Object.fromEntries(
  [
    MAT_GEL, MAT_BAT_WING, MAT_MUSHROOM_CAP, MAT_ROCK_SALT, MAT_CRAB_CLAW, MAT_WOLF_MEAT,
    MAT_LIZARD_TAIL, MAT_JELLY_TENTACLE, MAT_FLOWER_HONEY, MAT_TROLL_STEAK, MAT_WRAITH_ESSENCE,
    MAT_ABYSS_TENTACLE, MAT_CRYSTAL_JELLY, MAT_VOID_ESSENCE,
    MAT_CARAPACE, MAT_MITHRIL, MAT_CORE,
    MAT_ELITE_CORE_1, MAT_ELITE_CORE_2, MAT_ELITE_CORE_3, MAT_ELITE_CORE_4, MAT_ELITE_CORE_5,
    MAT_ELITE_CORE_6,
    MAT_SIGIL_WARRIOR, MAT_SIGIL_MAGE, MAT_SIGIL_ROGUE, MAT_SIGIL_PRIEST, MAT_SIGIL_RANGER,
    MAT_SIGIL_BARD,
  ].map((m) => [m.id, m]),
);
