import type { BaseStats, ClassId, MapId, MaterialId, MonsterId } from '../engine/types';

export interface MonsterDef {
  id: MonsterId;
  name: string;
  icon: string;
  base: BaseStats;
  exp: number;
  gold: number;
  /** 加权掉落表（迷宫饭式：食材 = 魔物部位） */
  drops: Array<{ materialId: MaterialId; count: number; weight: number }>;
}

// ══════════ 苔藓洞窟（1-4 层） ══════════
const SLIME: MonsterDef = {
  id: 'slime', name: '苔原史莱姆', icon: '🟢',
  base: { hp: 30, atk: 6, def: 2, spd: 5 }, exp: 8, gold: 3,
  drops: [{ materialId: 'mat_gel', count: 1, weight: 10 }],
};
const BAT: MonsterDef = {
  id: 'bat', name: '洞穴蝙蝠', icon: '🦇',
  base: { hp: 22, atk: 8, def: 1, spd: 12 }, exp: 9, gold: 4,
  drops: [
    { materialId: 'mat_bat_wing', count: 1, weight: 8 },
    { materialId: 'mat_gel', count: 1, weight: 3 },
  ],
};
const MUSHROOM: MonsterDef = {
  id: 'mushroom', name: '咆哮蘑菇', icon: '🍄',
  base: { hp: 40, atk: 5, def: 6, spd: 3 }, exp: 12, gold: 5,
  drops: [
    { materialId: 'mat_mushroom_cap', count: 1, weight: 8 },
    { materialId: 'mat_rock_salt', count: 1, weight: 3 },
  ],
};
const SLIME_KING: MonsterDef = {
  id: 'slime_king', name: '史莱姆之王', icon: '👑',
  base: { hp: 150, atk: 10, def: 4, spd: 4 }, exp: 40, gold: 25,
  drops: [
    { materialId: 'mat_gel', count: 3, weight: 10 },
    { materialId: 'mat_mushroom_cap', count: 1, weight: 4 },
  ],
};
const BIG_SLIME: MonsterDef = {
  id: 'big_slime', name: '大史莱姆', icon: '🟩',
  base: { hp: 55, atk: 9, def: 4, spd: 4 }, exp: 16, gold: 6,
  drops: [{ materialId: 'mat_gel', count: 2, weight: 10 }],
};
const VENOM_BAT: MonsterDef = {
  id: 'venom_bat', name: '剧毒蝙蝠', icon: '🦇',
  base: { hp: 40, atk: 12, def: 2, spd: 13 }, exp: 18, gold: 7,
  drops: [
    { materialId: 'mat_bat_wing', count: 1, weight: 7 },
    { materialId: 'mat_rock_salt', count: 1, weight: 3 },
  ],
};
const BAT_LORD: MonsterDef = {
  id: 'bat_lord', name: '双首蝠王', icon: '👑',
  base: { hp: 230, atk: 16, def: 5, spd: 14 }, exp: 60, gold: 40,
  drops: [
    { materialId: 'mat_bat_wing', count: 3, weight: 10 },
    { materialId: 'mat_rock_salt', count: 2, weight: 4 },
  ],
};
const ROCK_CRAB: MonsterDef = {
  id: 'rock_crab', name: '岩壳蟹', icon: '🦀',
  base: { hp: 75, atk: 11, def: 10, spd: 5 }, exp: 26, gold: 9,
  drops: [
    { materialId: 'mat_crab_claw', count: 1, weight: 8 },
    { materialId: 'mat_carapace', count: 1, weight: 5 },
  ],
};
const SPORE_MUSHROOM: MonsterDef = {
  id: 'spore_mushroom', name: '孢子蘑菇', icon: '🍄',
  base: { hp: 65, atk: 13, def: 7, spd: 4 }, exp: 24, gold: 8,
  drops: [
    { materialId: 'mat_mushroom_cap', count: 1, weight: 6 },
    { materialId: 'mat_rock_salt', count: 1, weight: 5 },
  ],
};
const CRAB_KING: MonsterDef = {
  id: 'crab_king', name: '岩壳巨蟹', icon: '👑',
  base: { hp: 380, atk: 20, def: 14, spd: 6 }, exp: 110, gold: 70,
  drops: [
    { materialId: 'mat_crab_claw', count: 3, weight: 10 },
    { materialId: 'mat_carapace', count: 2, weight: 5 },
  ],
};
const MOSS_WOLF: MonsterDef = {
  id: 'moss_wolf', name: '苔藓狼', icon: '🐺',
  base: { hp: 90, atk: 18, def: 8, spd: 12 }, exp: 34, gold: 12,
  drops: [
    { materialId: 'mat_wolf_meat', count: 1, weight: 8 },
    { materialId: 'mat_rock_salt', count: 1, weight: 3 },
  ],
};
const CAVE_LIZARD: MonsterDef = {
  id: 'cave_lizard', name: '穴居蜥蜴', icon: '🦎',
  base: { hp: 110, atk: 15, def: 12, spd: 7 }, exp: 36, gold: 13,
  drops: [
    { materialId: 'mat_lizard_tail', count: 1, weight: 7 },
    { materialId: 'mat_rock_salt', count: 1, weight: 4 },
  ],
};
const WOLF_ALPHA: MonsterDef = {
  id: 'wolf_alpha', name: '苔藓狼王', icon: '👑',
  base: { hp: 520, atk: 26, def: 12, spd: 14 }, exp: 180, gold: 120,
  drops: [
    { materialId: 'mat_wolf_meat', count: 3, weight: 10 },
    { materialId: 'mat_mushroom_cap', count: 2, weight: 4 },
  ],
};

// ══════════ 秘银矿道 / 暗影回廊（5-6 层） ══════════
const GLOW_JELLY: MonsterDef = {
  id: 'glow_jelly', name: '幽光水母', icon: '🪼',
  base: { hp: 120, atk: 22, def: 10, spd: 9 }, exp: 48, gold: 17,
  drops: [
    { materialId: 'mat_jelly_tentacle', count: 1, weight: 8 },
    { materialId: 'mat_gel', count: 2, weight: 4 },
  ],
};
const STONE_GOLEM: MonsterDef = {
  id: 'stone_golem', name: '石皮傀儡', icon: '🗿',
  base: { hp: 180, atk: 20, def: 20, spd: 4 }, exp: 55, gold: 20,
  drops: [
    { materialId: 'mat_mithril', count: 1, weight: 5 },
    { materialId: 'mat_carapace', count: 2, weight: 5 },
  ],
};
const GOLEM_GUARD: MonsterDef = {
  id: 'golem_guard', name: '傀儡守卫', icon: '👑',
  base: { hp: 750, atk: 32, def: 24, spd: 5 }, exp: 260, gold: 180,
  drops: [
    { materialId: 'mat_mithril', count: 2, weight: 10 },
    { materialId: 'mat_carapace', count: 3, weight: 5 },
  ],
};
const SHADOW_SPIDER: MonsterDef = {
  id: 'shadow_spider', name: '暗影蜘蛛', icon: '🕷️',
  base: { hp: 140, atk: 28, def: 12, spd: 15 }, exp: 66, gold: 23,
  drops: [
    { materialId: 'mat_carapace', count: 1, weight: 6 },
    { materialId: 'mat_rock_salt', count: 1, weight: 4 },
  ],
};
const IRON_BEETLE: MonsterDef = {
  id: 'iron_beetle', name: '铁甲甲虫', icon: '🪲',
  base: { hp: 200, atk: 24, def: 24, spd: 6 }, exp: 70, gold: 26,
  drops: [
    { materialId: 'mat_carapace', count: 2, weight: 8 },
    { materialId: 'mat_mithril', count: 1, weight: 4 },
  ],
};
const WEAVER_QUEEN: MonsterDef = {
  id: 'weaver_queen', name: '织网妖后', icon: '👑',
  base: { hp: 900, atk: 40, def: 18, spd: 16 }, exp: 340, gold: 240,
  drops: [
    { materialId: 'mat_carapace', count: 3, weight: 10 },
    { materialId: 'mat_mithril', count: 1, weight: 5 },
  ],
};

// ══════════ 骸骨墓穴 / 熔岩裂隙（7-8 层） ══════════
const MAN_EATER: MonsterDef = {
  id: 'man_eater', name: '食人花', icon: '🌺',
  base: { hp: 180, atk: 34, def: 16, spd: 8 }, exp: 88, gold: 31,
  drops: [
    { materialId: 'mat_flower_honey', count: 1, weight: 8 },
    { materialId: 'mat_mushroom_cap', count: 1, weight: 3 },
  ],
};
const SKELETON: MonsterDef = {
  id: 'skeleton', name: '骷髅兵', icon: '💀',
  base: { hp: 220, atk: 32, def: 20, spd: 10 }, exp: 92, gold: 34,
  drops: [
    { materialId: 'mat_mithril', count: 1, weight: 5 },
    { materialId: 'mat_rock_salt', count: 1, weight: 5 },
  ],
};
const SKELETON_CAPTAIN: MonsterDef = {
  id: 'skeleton_captain', name: '骷髅队长', icon: '☠️',
  base: { hp: 1100, atk: 48, def: 24, spd: 12 }, exp: 440, gold: 320,
  drops: [
    { materialId: 'mat_mithril', count: 3, weight: 10 },
    { materialId: 'mat_core', count: 1, weight: 3 },
  ],
};
const CAVE_TROLL: MonsterDef = {
  id: 'cave_troll', name: '洞穴巨魔', icon: '👹',
  base: { hp: 300, atk: 44, def: 22, spd: 7 }, exp: 120, gold: 44,
  drops: [
    { materialId: 'mat_troll_steak', count: 1, weight: 8 },
    { materialId: 'mat_wolf_meat', count: 1, weight: 3 },
  ],
};
const ACID_SLIME: MonsterDef = {
  id: 'acid_slime', name: '酸液史莱姆', icon: '🫧',
  base: { hp: 240, atk: 40, def: 18, spd: 8 }, exp: 110, gold: 40,
  drops: [
    { materialId: 'mat_gel', count: 3, weight: 8 },
    { materialId: 'mat_rock_salt', count: 1, weight: 5 },
  ],
};
const TROLL_WARLORD: MonsterDef = {
  id: 'troll_warlord', name: '巨魔督军', icon: '👑',
  base: { hp: 1400, atk: 58, def: 28, spd: 8 }, exp: 560, gold: 420,
  drops: [
    { materialId: 'mat_troll_steak', count: 2, weight: 10 },
    { materialId: 'mat_mithril', count: 2, weight: 5 },
  ],
};

// ══════════ 幽魂深渊 / 深渊之心（9-10 层） ══════════
const WRAITH: MonsterDef = {
  id: 'wraith', name: '幽魂', icon: '👻',
  base: { hp: 260, atk: 52, def: 20, spd: 18 }, exp: 150, gold: 55,
  drops: [
    { materialId: 'mat_wraith_essence', count: 1, weight: 6 },
    { materialId: 'mat_gel', count: 1, weight: 4 },
  ],
};
const SHADOW_HUNTER: MonsterDef = {
  id: 'shadow_hunter', name: '暗影猎手', icon: '🌑',
  base: { hp: 300, atk: 50, def: 24, spd: 14 }, exp: 155, gold: 58,
  drops: [
    { materialId: 'mat_mithril', count: 1, weight: 6 },
    { materialId: 'mat_bat_wing', count: 2, weight: 4 },
  ],
};
const BASILISK: MonsterDef = {
  id: 'basilisk', name: '石化蜥蜴', icon: '🐍',
  base: { hp: 340, atk: 46, def: 30, spd: 9 }, exp: 160, gold: 60,
  drops: [
    { materialId: 'mat_lizard_tail', count: 2, weight: 7 },
    { materialId: 'mat_mithril', count: 1, weight: 5 },
  ],
};
const WRAITH_LORD: MonsterDef = {
  id: 'wraith_lord', name: '幽魂领主', icon: '👑',
  base: { hp: 1700, atk: 66, def: 26, spd: 19 }, exp: 700, gold: 540,
  drops: [
    { materialId: 'mat_wraith_essence', count: 2, weight: 10 },
    { materialId: 'mat_mithril', count: 3, weight: 5 },
  ],
};
const ABYSS_TENTACLE: MonsterDef = {
  id: 'abyss_tentacle', name: '深渊触手', icon: '🐙',
  base: { hp: 380, atk: 60, def: 26, spd: 11 }, exp: 200, gold: 75,
  drops: [
    { materialId: 'mat_abyss_tentacle', count: 1, weight: 6 },
    { materialId: 'mat_gel', count: 2, weight: 4 },
  ],
};
const OBSIDIAN_GOLEM: MonsterDef = {
  id: 'obsidian_golem', name: '黑曜石魔像', icon: '🗿',
  base: { hp: 450, atk: 56, def: 36, spd: 6 }, exp: 210, gold: 80,
  drops: [
    { materialId: 'mat_core', count: 1, weight: 4 },
    { materialId: 'mat_mithril', count: 3, weight: 7 },
  ],
};
const NIGHTMARE: MonsterDef = {
  id: 'nightmare', name: '深渊守护者·梦魇', icon: '🌌',
  base: { hp: 2200, atk: 78, def: 34, spd: 13 }, exp: 900, gold: 700,
  drops: [
    { materialId: 'mat_core', count: 2, weight: 10 },
    { materialId: 'mat_mithril', count: 4, weight: 6 },
  ],
};

// ══════════ 水晶回廊（11-15 层） ══════════
const CRYSTAL_SLIME: MonsterDef = {
  id: 'crystal_slime', name: '晶核史莱姆', icon: '💠',
  base: { hp: 500, atk: 68, def: 30, spd: 10 }, exp: 260, gold: 95,
  drops: [{ materialId: 'mat_crystal_jelly', count: 2, weight: 10 }],
};
const CRYSTAL_BAT: MonsterDef = {
  id: 'crystal_bat', name: '晶翼蝠', icon: '🦇',
  base: { hp: 420, atk: 75, def: 26, spd: 17 }, exp: 270, gold: 100,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 1, weight: 6 },
    { materialId: 'mat_bat_wing', count: 2, weight: 5 },
  ],
};
const CRYSTAL_MOTHER: MonsterDef = {
  id: 'crystal_mother', name: '晶核史莱姆之母', icon: '👑',
  base: { hp: 2800, atk: 88, def: 36, spd: 11 }, exp: 1000, gold: 800,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 4, weight: 10 },
    { materialId: 'mat_mithril', count: 3, weight: 5 },
  ],
};
const GEM_GOLEM: MonsterDef = {
  id: 'gem_golem', name: '宝石魔像', icon: '🗿',
  base: { hp: 650, atk: 80, def: 45, spd: 8 }, exp: 300, gold: 115,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 1, weight: 5 },
    { materialId: 'mat_mithril', count: 2, weight: 6 },
  ],
};
const GEM_TITAN: MonsterDef = {
  id: 'gem_titan', name: '宝石泰坦', icon: '👑',
  base: { hp: 3200, atk: 95, def: 50, spd: 9 }, exp: 1100, gold: 900,
  drops: [
    { materialId: 'mat_mithril', count: 5, weight: 10 },
    { materialId: 'mat_core', count: 1, weight: 4 },
  ],
};
const VOID_SPIDER: MonsterDef = {
  id: 'void_spider', name: '虚空蜘蛛', icon: '🕷️',
  base: { hp: 600, atk: 95, def: 35, spd: 18 }, exp: 340, gold: 130,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 2, weight: 6 },
    { materialId: 'mat_carapace', count: 2, weight: 5 },
  ],
};
const VOID_WEAVER: MonsterDef = {
  id: 'void_weaver', name: '虚空织网者', icon: '👑',
  base: { hp: 3600, atk: 105, def: 40, spd: 19 }, exp: 1250, gold: 1000,
  drops: [
    { materialId: 'mat_void_essence', count: 1, weight: 8 },
    { materialId: 'mat_crystal_jelly', count: 3, weight: 7 },
  ],
};
const ICE_LIZARD: MonsterDef = {
  id: 'ice_lizard', name: '冰晶蜥蜴', icon: '🦎',
  base: { hp: 700, atk: 92, def: 48, spd: 12 }, exp: 370, gold: 140,
  drops: [
    { materialId: 'mat_lizard_tail', count: 2, weight: 7 },
    { materialId: 'mat_crystal_jelly', count: 1, weight: 5 },
  ],
};
const FROST_BASILISK: MonsterDef = {
  id: 'frost_basilisk', name: '霜晶石化蜥蜴王', icon: '👑',
  base: { hp: 4200, atk: 112, def: 52, spd: 13 }, exp: 1400, gold: 1150,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 4, weight: 10 },
    { materialId: 'mat_core', count: 1, weight: 4 },
  ],
};
const AMETHYST_BEETLE: MonsterDef = {
  id: 'amethyst_beetle', name: '紫晶甲虫', icon: '🪲',
  base: { hp: 750, atk: 98, def: 55, spd: 9 }, exp: 400, gold: 155,
  drops: [
    { materialId: 'mat_carapace', count: 3, weight: 7 },
    { materialId: 'mat_crystal_jelly', count: 1, weight: 5 },
  ],
};
const CRYSTAL_BEETLE_KING: MonsterDef = {
  id: 'crystal_beetle_king', name: '紫晶虫王', icon: '👑',
  base: { hp: 4800, atk: 118, def: 58, spd: 10 }, exp: 1550, gold: 1250,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 5, weight: 10 },
    { materialId: 'mat_mithril', count: 4, weight: 6 },
  ],
};

// ══════════ 虚空裂隙（16-20 层） ══════════
const MIND_FLAYER: MonsterDef = {
  id: 'mind_flayer', name: '灵吸怪', icon: '🐙',
  base: { hp: 800, atk: 125, def: 42, spd: 15 }, exp: 460, gold: 180,
  drops: [
    { materialId: 'mat_abyss_tentacle', count: 2, weight: 7 },
    { materialId: 'mat_void_essence', count: 1, weight: 5 },
  ],
};
const ELDER_FLAYER: MonsterDef = {
  id: 'elder_flayer', name: '长老灵吸怪', icon: '👑',
  base: { hp: 5600, atk: 135, def: 48, spd: 16 }, exp: 1750, gold: 1450,
  drops: [
    { materialId: 'mat_abyss_tentacle', count: 4, weight: 10 },
    { materialId: 'mat_void_essence', count: 2, weight: 6 },
    { materialId: 'mat_core', count: 1, weight: 4 },
  ],
};
const VOID_WRAITH: MonsterDef = {
  id: 'void_wraith', name: '虚空幽魂', icon: '👻',
  base: { hp: 750, atk: 130, def: 45, spd: 20 }, exp: 500, gold: 195,
  drops: [{ materialId: 'mat_void_essence', count: 2, weight: 10 }],
};
const VOID_REAPER: MonsterDef = {
  id: 'void_reaper', name: '虚空收割者', icon: '👑',
  base: { hp: 6400, atk: 148, def: 50, spd: 21 }, exp: 1950, gold: 1600,
  drops: [
    { materialId: 'mat_void_essence', count: 3, weight: 10 },
    { materialId: 'mat_core', count: 2, weight: 5 },
  ],
};
const PURPLE_WORM: MonsterDef = {
  id: 'purple_worm', name: '紫色蠕虫', icon: '🐍',
  base: { hp: 950, atk: 140, def: 55, spd: 10 }, exp: 560, gold: 220,
  drops: [
    { materialId: 'mat_void_essence', count: 1, weight: 6 },
    { materialId: 'mat_lizard_tail', count: 2, weight: 5 },
  ],
};
const CRYSTAL_DRAGON: MonsterDef = {
  id: 'crystal_dragon', name: '晶龙', icon: '👑',
  base: { hp: 7200, atk: 160, def: 60, spd: 13 }, exp: 2200, gold: 1850,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 4, weight: 8 },
    { materialId: 'mat_void_essence', count: 3, weight: 7 },
    { materialId: 'mat_core', count: 2, weight: 5 },
  ],
};
const NIGHTMARE_SHADE: MonsterDef = {
  id: 'nightmare_shade', name: '梦魇暗影', icon: '🌑',
  base: { hp: 900, atk: 155, def: 52, spd: 19 }, exp: 640, gold: 250,
  drops: [
    { materialId: 'mat_void_essence', count: 2, weight: 8 },
    { materialId: 'mat_wraith_essence', count: 1, weight: 5 },
  ],
};
const SHADE_LORD: MonsterDef = {
  id: 'shade_lord', name: '暗影君主', icon: '👑',
  base: { hp: 8200, atk: 172, def: 58, spd: 20 }, exp: 2500, gold: 2100,
  drops: [
    { materialId: 'mat_void_essence', count: 4, weight: 10 },
    { materialId: 'mat_core', count: 2, weight: 6 },
  ],
};
const VOID_HEART_LARVA: MonsterDef = {
  id: 'void_heart_larva', name: '虚空之核幼体', icon: '💠',
  base: { hp: 1100, atk: 165, def: 60, spd: 12 }, exp: 750, gold: 300,
  drops: [
    { materialId: 'mat_void_essence', count: 2, weight: 8 },
    { materialId: 'mat_core', count: 1, weight: 4 },
  ],
};
const THE_VOID_HEART: MonsterDef = {
  id: 'the_void_heart', name: '虚空之心', icon: '👑',
  base: { hp: 10000, atk: 190, def: 65, spd: 14 }, exp: 3000, gold: 2500,
  drops: [
    { materialId: 'mat_core', count: 3, weight: 10 },
    { materialId: 'mat_void_essence', count: 5, weight: 8 },
    { materialId: 'mat_mithril', count: 8, weight: 6 },
  ],
};

// ══════════ 扩充普通怪（每图一只，丰富掉落与图鉴） ══════════
const MUCK_SLUG: MonsterDef = {
  id: 'muck_slug', name: '淤泥怪', icon: '🟫',
  base: { hp: 45, atk: 7, def: 5, spd: 3 }, exp: 13, gold: 5,
  drops: [
    { materialId: 'mat_gel', count: 2, weight: 10 },
    { materialId: 'mat_rock_salt', count: 1, weight: 3 },
  ],
};
const FAERIE: MonsterDef = {
  id: 'faerie', name: '矿道妖精', icon: '🧚',
  base: { hp: 60, atk: 14, def: 3, spd: 15 }, exp: 22, gold: 8,
  drops: [
    { materialId: 'mat_jelly_tentacle', count: 1, weight: 5 },
    { materialId: 'mat_gel', count: 1, weight: 5 },
  ],
};
const MUMMY: MonsterDef = {
  id: 'mummy', name: '缠绷带的不朽者', icon: '🧟',
  base: { hp: 130, atk: 24, def: 8, spd: 5 }, exp: 50, gold: 18,
  drops: [
    { materialId: 'mat_wraith_essence', count: 1, weight: 6 },
    { materialId: 'mat_rock_salt', count: 1, weight: 4 },
  ],
};
const HELLHOUND: MonsterDef = {
  id: 'hellhound', name: '地狱犬', icon: '🐕',
  base: { hp: 260, atk: 46, def: 15, spd: 17 }, exp: 130, gold: 48,
  drops: [
    { materialId: 'mat_troll_steak', count: 1, weight: 5 },
    { materialId: 'mat_rock_salt', count: 1, weight: 4 },
  ],
};
const YETI: MonsterDef = {
  id: 'yeti', name: '雪原巨怪', icon: '❄️',
  base: { hp: 480, atk: 70, def: 28, spd: 9 }, exp: 260, gold: 95,
  drops: [
    { materialId: 'mat_crystal_jelly', count: 1, weight: 5 },
    { materialId: 'mat_lizard_tail', count: 1, weight: 4 },
  ],
};
const VOID_IMP: MonsterDef = {
  id: 'void_imp', name: '虚空小鬼', icon: '😈',
  base: { hp: 850, atk: 120, def: 40, spd: 20 }, exp: 560, gold: 220,
  drops: [
    { materialId: 'mat_void_essence', count: 1, weight: 6 },
    { materialId: 'mat_crystal_jelly', count: 1, weight: 3 },
  ],
};

export const MONSTERS: Record<MonsterId, MonsterDef> = Object.fromEntries(
  [
    SLIME, BAT, MUSHROOM, SLIME_KING, BIG_SLIME, VENOM_BAT, BAT_LORD,
    ROCK_CRAB, SPORE_MUSHROOM, CRAB_KING, MOSS_WOLF, CAVE_LIZARD, WOLF_ALPHA,
    GLOW_JELLY, STONE_GOLEM, GOLEM_GUARD, SHADOW_SPIDER, IRON_BEETLE, WEAVER_QUEEN,
    MAN_EATER, SKELETON, SKELETON_CAPTAIN, CAVE_TROLL, ACID_SLIME, TROLL_WARLORD,
    WRAITH, SHADOW_HUNTER, BASILISK, WRAITH_LORD, ABYSS_TENTACLE, OBSIDIAN_GOLEM, NIGHTMARE,
    CRYSTAL_SLIME, CRYSTAL_BAT, CRYSTAL_MOTHER, GEM_GOLEM, GEM_TITAN, VOID_SPIDER, VOID_WEAVER,
    ICE_LIZARD, FROST_BASILISK, AMETHYST_BEETLE, CRYSTAL_BEETLE_KING,
    MIND_FLAYER, ELDER_FLAYER, VOID_WRAITH, VOID_REAPER, PURPLE_WORM, CRYSTAL_DRAGON,
    NIGHTMARE_SHADE, SHADE_LORD, VOID_HEART_LARVA, THE_VOID_HEART,
    MUCK_SLUG, FAERIE, MUMMY, HELLHOUND, YETI, VOID_IMP,
  ].map((m) => [m.id, m]),
);

/** 精英怪定义：借用某魔物的体型/贴图（基础数值 × 精英倍率），掉落职业徽记 */
export interface EliteDef {
  id: string;
  name: string;
  /** 借用体型的魔物（决定贴图与基础数值） */
  base: MonsterId;
  /** 击杀掉落的职业徽记（对应该职业的升级仪式） */
  sigil: ClassId;
}

export interface MapDef {
  id: MapId;
  /** 地图编号（1~6） */
  number: number;
  name: string;
  icon: string;
  /** 常规魔物池（随机组波，可重复出现） */
  monsterPool: MonsterId[];
  /** 精英池（每波 5% 概率随机抽一只替代 BOSS 概念，附 1-2 只护卫；掉落职业徽记+本图魔核） */
  elitePool: EliteDef[];
  /** 首次击杀本图精英怪获得的声望（并解锁下一张图） */
  firstClearReputation: number;
  /** 主题地板贴图（public/sprites/tiles/ 下文件名）：[基底A, 基底B, 点缀]，战斗视口按位置哈希混铺 */
  floorSprites: string[];
  /** PixiJS tint 主题色（叠加在地板贴图上做主题差异） */
  floorTint: number;
}

/**
 * 地图体系：6 张主题地图，无限循环——随机组波、5% 概率精英波；
 * 首次击杀本图精英怪解锁下一张。精英掉落职业徽记 + 本图魔核（升级仪式 3-8 级对应图 1-6）。
 */
export const MAP_DEFS: MapDef[] = [
  {
    id: 'map_1', number: 1, name: '苔藓洞窟', icon: '🕳️',
    monsterPool: ['slime', 'bat', 'mushroom', 'big_slime', 'venom_bat', 'rock_crab', 'spore_mushroom', 'moss_wolf', 'cave_lizard', 'muck_slug'],
    elitePool: [
      { id: 'e1_warrior', name: '苔藓兽王', base: 'wolf_alpha', sigil: 'warrior' },
      { id: 'e1_mage', name: '菌影术士', base: 'spore_mushroom', sigil: 'mage' },
      { id: 'e1_rogue', name: '岩壳掠夺者', base: 'crab_king', sigil: 'rogue' },
      { id: 'e1_priest', name: '苔原圣愈者', base: 'slime_king', sigil: 'priest' },
      { id: 'e1_ranger', name: '翠影猎手', base: 'cave_lizard', sigil: 'ranger' },
      { id: 'e1_bard', name: '洞穴歌蝠', base: 'bat_lord', sigil: 'bard' },
    ],
    firstClearReputation: 5,
    floorSprites: ['floor_tan_slab.png', 'floor_tan_flat.png', 'floor_ornate.png'], floorTint: 0xb8d8b8,
  },
  {
    id: 'map_2', number: 2, name: '秘银矿道', icon: '⛏️',
    monsterPool: ['glow_jelly', 'stone_golem', 'shadow_spider', 'iron_beetle', 'moss_wolf', 'cave_lizard', 'rock_crab', 'faerie'],
    elitePool: [
      { id: 'e2_warrior', name: '秘银壁垒', base: 'golem_guard', sigil: 'warrior' },
      { id: 'e2_mage', name: '幽光织法者', base: 'glow_jelly', sigil: 'mage' },
      { id: 'e2_rogue', name: '矿道影刃', base: 'shadow_spider', sigil: 'rogue' },
      { id: 'e2_priest', name: '深巷圣工', base: 'faerie', sigil: 'priest' },
      { id: 'e2_ranger', name: '秘银猎虫', base: 'iron_beetle', sigil: 'ranger' },
      { id: 'e2_bard', name: '织网歌者', base: 'weaver_queen', sigil: 'bard' },
    ],
    firstClearReputation: 20,
    floorSprites: ['floor_stone_plain.png', 'floor_stone_grid.png', 'floor_stone_edge.png'], floorTint: 0xa8c4e0,
  },
  {
    id: 'map_3', number: 3, name: '骸骨墓穴', icon: '💀',
    monsterPool: ['skeleton', 'man_eater', 'shadow_spider', 'iron_beetle', 'spore_mushroom', 'mummy'],
    elitePool: [
      { id: 'e3_warrior', name: '骸骨近卫长', base: 'skeleton_captain', sigil: 'warrior' },
      { id: 'e3_mage', name: '亡者咒师', base: 'mummy', sigil: 'mage' },
      { id: 'e3_rogue', name: '墓穴盗影', base: 'shadow_spider', sigil: 'rogue' },
      { id: 'e3_priest', name: '安魂诵经者', base: 'skeleton', sigil: 'priest' },
      { id: 'e3_ranger', name: '副葬猎手', base: 'iron_beetle', sigil: 'ranger' },
      { id: 'e3_bard', name: '菌影吟者', base: 'spore_mushroom', sigil: 'bard' },
    ],
    firstClearReputation: 30,
    floorSprites: ['floor_brick.png', 'floor_brown_flat.png', 'floor_emblem.png'], floorTint: 0xb0a8c8,
  },
  {
    id: 'map_4', number: 4, name: '熔岩裂隙', icon: '🔥',
    monsterPool: ['acid_slime', 'cave_troll', 'wraith', 'basilisk', 'shadow_hunter', 'abyss_tentacle', 'obsidian_golem', 'hellhound'],
    elitePool: [
      { id: 'e4_warrior', name: '熔岩战魁', base: 'troll_warlord', sigil: 'warrior' },
      { id: 'e4_mage', name: '焚天咒焰', base: 'nightmare', sigil: 'mage' },
      { id: 'e4_rogue', name: '灰烬潜行者', base: 'shadow_hunter', sigil: 'rogue' },
      { id: 'e4_priest', name: '烬光圣使', base: 'wraith_lord', sigil: 'priest' },
      { id: 'e4_ranger', name: '火环游猎者', base: 'hellhound', sigil: 'ranger' },
      { id: 'e4_bard', name: '裂隙歌魔', base: 'basilisk', sigil: 'bard' },
    ],
    firstClearReputation: 42,
    floorSprites: ['floor_tan_top.png', 'floor_tan_flat2.png', 'floor_grate.png'], floorTint: 0xe0a888,
  },
  {
    id: 'map_5', number: 5, name: '水晶回廊', icon: '💠',
    monsterPool: ['crystal_slime', 'crystal_bat', 'void_spider', 'ice_lizard', 'gem_golem', 'amethyst_beetle', 'wraith', 'yeti', 'void_weaver'],
    elitePool: [
      { id: 'e5_warrior', name: '晶铠百夫长', base: 'gem_titan', sigil: 'warrior' },
      { id: 'e5_mage', name: '棱镜咏叹调', base: 'crystal_mother', sigil: 'mage' },
      { id: 'e5_rogue', name: '折光刺客', base: 'void_spider', sigil: 'rogue' },
      { id: 'e5_priest', name: '霜晶圣女', base: 'frost_basilisk', sigil: 'priest' },
      { id: 'e5_ranger', name: '冰原巡猎者', base: 'yeti', sigil: 'ranger' },
      { id: 'e5_bard', name: '晶铠歌姬', base: 'crystal_beetle_king', sigil: 'bard' },
    ],
    firstClearReputation: 60,
    floorSprites: ['floor_stone_grid.png', 'floor_stone_plain.png', 'floor_ornate.png'], floorTint: 0x98d8e8,
  },
  {
    id: 'map_6', number: 6, name: '虚空终焉', icon: '🌌',
    monsterPool: ['mind_flayer', 'void_wraith', 'purple_worm', 'nightmare_shade', 'void_heart_larva', 'void_imp'],
    elitePool: [
      { id: 'e6_warrior', name: '虚空斩灭者', base: 'void_reaper', sigil: 'warrior' },
      { id: 'e6_mage', name: '星渊大灵吸', base: 'elder_flayer', sigil: 'mage' },
      { id: 'e6_rogue', name: '无光处刑人', base: 'nightmare_shade', sigil: 'rogue' },
      { id: 'e6_priest', name: '虚空弥撒', base: 'the_void_heart', sigil: 'priest' },
      { id: 'e6_ranger', name: '终焉猎首', base: 'crystal_dragon', sigil: 'ranger' },
      { id: 'e6_bard', name: '万籁俱寂', base: 'shade_lord', sigil: 'bard' },
    ],
    firstClearReputation: 85,
    floorSprites: ['floor_brick.png', 'floor_slab_cracked.png', 'floor_emblem.png'], floorTint: 0x9888c8,
  },
];

export const MAPS: Record<MapId, MapDef> = Object.fromEntries(
  MAP_DEFS.map((m) => [m.id, m]),
);

/** 地图 ID 规则：map_<number> */
export function mapIdOf(number: number): MapId {
  return `map_${number}`;
}

/** 地图掉落表汇总（情报网掉落预览用） */
export function mapDropTable(mapId: MapId): Array<{ materialId: MaterialId; from: string[] }> {
  const map = MAPS[mapId];
  const map_ = new Map<string, Set<string>>();
  for (const mid of map.monsterPool) {
    for (const d of MONSTERS[mid].drops) {
      if (!map_.has(d.materialId)) map_.set(d.materialId, new Set());
      map_.get(d.materialId)!.add(MONSTERS[mid].name);
    }
  }
  return [...map_.entries()].map(([materialId, from]) => ({ materialId, from: [...from] }));
}
