import type { BaseStats, FloorId, MaterialId, MonsterId } from '../engine/types';

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
  ].map((m) => [m.id, m]),
);

export interface WaveDef {
  monsters: MonsterId[];
  isBoss?: boolean;
}

export interface FloorDef {
  id: FloorId;
  /** 层数（1~20） */
  number: number;
  name: string;
  icon: string;
  waves: WaveDef[];
  /** 首杀层底 BOSS 获得的声望 */
  firstClearReputation: number;
}

/** 楼层 ID 规则：floor_<number> */
export function floorIdOf(number: number): FloorId {
  return `floor_${number}`;
}

const W = (...monsters: MonsterId[]): WaveDef => ({ monsters });

export const FLOOR_DEFS: FloorDef[] = [
  {
    id: 'floor_1', number: 1, name: '苔藓洞窟 · 第 1 层', icon: '🕳️', firstClearReputation: 5,
    waves: [W('slime', 'slime'), W('slime', 'slime', 'bat'), W('bat', 'bat', 'mushroom'), W('mushroom', 'mushroom', 'slime', 'slime'), { monsters: ['slime_king'], isBoss: true }],
  },
  {
    id: 'floor_2', number: 2, name: '苔藓洞窟 · 第 2 层', icon: '🕳️', firstClearReputation: 8,
    waves: [W('big_slime', 'big_slime'), W('big_slime', 'venom_bat', 'venom_bat'), W('venom_bat', 'venom_bat', 'mushroom'), W('big_slime', 'big_slime', 'venom_bat'), { monsters: ['bat_lord'], isBoss: true }],
  },
  {
    id: 'floor_3', number: 3, name: '苔藓洞窟 · 第 3 层', icon: '🕳️', firstClearReputation: 12,
    waves: [W('rock_crab', 'rock_crab'), W('rock_crab', 'spore_mushroom'), W('spore_mushroom', 'spore_mushroom', 'bat'), W('rock_crab', 'rock_crab', 'spore_mushroom'), { monsters: ['crab_king'], isBoss: true }],
  },
  {
    id: 'floor_4', number: 4, name: '苔藓洞窟 · 第 4 层', icon: '🌿', firstClearReputation: 16,
    waves: [W('moss_wolf', 'moss_wolf'), W('moss_wolf', 'moss_wolf', 'cave_lizard'), W('cave_lizard', 'cave_lizard', 'rock_crab'), W('moss_wolf', 'moss_wolf', 'cave_lizard'), { monsters: ['wolf_alpha'], isBoss: true }],
  },
  {
    id: 'floor_5', number: 5, name: '秘银矿道 · 第 5 层', icon: '⛏️', firstClearReputation: 20,
    waves: [W('glow_jelly', 'glow_jelly'), W('glow_jelly', 'stone_golem'), W('stone_golem', 'glow_jelly', 'glow_jelly'), W('stone_golem', 'stone_golem', 'moss_wolf'), { monsters: ['golem_guard'], isBoss: true }],
  },
  {
    id: 'floor_6', number: 6, name: '暗影回廊 · 第 6 层', icon: '🕸️', firstClearReputation: 25,
    waves: [W('shadow_spider', 'shadow_spider'), W('shadow_spider', 'iron_beetle'), W('iron_beetle', 'iron_beetle', 'shadow_spider'), W('shadow_spider', 'shadow_spider', 'iron_beetle'), { monsters: ['weaver_queen'], isBoss: true }],
  },
  {
    id: 'floor_7', number: 7, name: '骸骨墓穴 · 第 7 层', icon: '💀', firstClearReputation: 30,
    waves: [W('skeleton', 'skeleton'), W('man_eater', 'skeleton'), W('man_eater', 'man_eater', 'shadow_spider'), W('skeleton', 'skeleton', 'man_eater'), { monsters: ['skeleton_captain'], isBoss: true }],
  },
  {
    id: 'floor_8', number: 8, name: '熔岩裂隙 · 第 8 层', icon: '🔥', firstClearReputation: 36,
    waves: [W('acid_slime', 'acid_slime'), W('cave_troll', 'acid_slime'), W('cave_troll', 'cave_troll', 'iron_beetle'), W('cave_troll', 'acid_slime', 'acid_slime'), { monsters: ['troll_warlord'], isBoss: true }],
  },
  {
    id: 'floor_9', number: 9, name: '幽魂深渊 · 第 9 层', icon: '👻', firstClearReputation: 42,
    waves: [W('wraith', 'wraith'), W('basilisk', 'shadow_hunter'), W('wraith', 'basilisk', 'shadow_hunter'), W('shadow_hunter', 'basilisk', 'wraith'), { monsters: ['wraith_lord'], isBoss: true }],
  },
  {
    id: 'floor_10', number: 10, name: '深渊之心 · 第 10 层', icon: '🌌', firstClearReputation: 50,
    waves: [W('abyss_tentacle', 'abyss_tentacle'), W('obsidian_golem', 'abyss_tentacle'), W('obsidian_golem', 'obsidian_golem', 'wraith'), W('abyss_tentacle', 'abyss_tentacle', 'obsidian_golem'), { monsters: ['nightmare'], isBoss: true }],
  },
  {
    id: 'floor_11', number: 11, name: '水晶回廊 · 第 11 层', icon: '💠', firstClearReputation: 55,
    waves: [W('crystal_slime', 'crystal_bat'), W('crystal_slime', 'crystal_slime', 'crystal_bat'), W('crystal_bat', 'crystal_bat', 'void_spider'), W('crystal_slime', 'crystal_bat', 'crystal_bat'), { monsters: ['crystal_mother'], isBoss: true }],
  },
  {
    id: 'floor_12', number: 12, name: '水晶回廊 · 第 12 层', icon: '💠', firstClearReputation: 60,
    waves: [W('gem_golem', 'gem_golem'), W('gem_golem', 'crystal_slime', 'crystal_bat'), W('crystal_bat', 'gem_golem', 'void_spider'), W('gem_golem', 'gem_golem', 'crystal_slime'), { monsters: ['gem_titan'], isBoss: true }],
  },
  {
    id: 'floor_13', number: 13, name: '水晶回廊 · 第 13 层', icon: '💠', firstClearReputation: 66,
    waves: [W('void_spider', 'void_spider'), W('ice_lizard', 'void_spider'), W('ice_lizard', 'ice_lizard', 'crystal_bat'), W('void_spider', 'void_spider', 'ice_lizard'), { monsters: ['void_weaver'], isBoss: true }],
  },
  {
    id: 'floor_14', number: 14, name: '水晶回廊 · 第 14 层', icon: '💠', firstClearReputation: 72,
    waves: [W('ice_lizard', 'ice_lizard'), W('amethyst_beetle', 'ice_lizard'), W('amethyst_beetle', 'amethyst_beetle', 'void_spider'), W('ice_lizard', 'amethyst_beetle', 'ice_lizard'), { monsters: ['frost_basilisk'], isBoss: true }],
  },
  {
    id: 'floor_15', number: 15, name: '水晶回廊 · 第 15 层', icon: '💠', firstClearReputation: 78,
    waves: [W('amethyst_beetle', 'amethyst_beetle'), W('amethyst_beetle', 'gem_golem', 'ice_lizard'), W('gem_golem', 'gem_golem', 'void_spider'), W('amethyst_beetle', 'amethyst_beetle', 'gem_golem'), { monsters: ['crystal_beetle_king'], isBoss: true }],
  },
  {
    id: 'floor_16', number: 16, name: '虚空裂隙 · 第 16 层', icon: '🕳️', firstClearReputation: 85,
    waves: [W('mind_flayer', 'mind_flayer'), W('mind_flayer', 'void_wraith'), W('void_wraith', 'void_wraith', 'mind_flayer'), W('mind_flayer', 'mind_flayer', 'void_wraith'), { monsters: ['elder_flayer'], isBoss: true }],
  },
  {
    id: 'floor_17', number: 17, name: '虚空裂隙 · 第 17 层', icon: '🕳️', firstClearReputation: 92,
    waves: [W('void_wraith', 'void_wraith'), W('purple_worm', 'void_wraith'), W('purple_worm', 'purple_worm', 'mind_flayer'), W('void_wraith', 'void_wraith', 'purple_worm'), { monsters: ['void_reaper'], isBoss: true }],
  },
  {
    id: 'floor_18', number: 18, name: '虚空裂隙 · 第 18 层', icon: '🕳️', firstClearReputation: 100,
    waves: [W('purple_worm', 'purple_worm'), W('nightmare_shade', 'purple_worm'), W('nightmare_shade', 'nightmare_shade', 'purple_worm'), W('purple_worm', 'nightmare_shade', 'purple_worm'), { monsters: ['crystal_dragon'], isBoss: true }],
  },
  {
    id: 'floor_19', number: 19, name: '虚空裂隙 · 第 19 层', icon: '🕳️', firstClearReputation: 108,
    waves: [W('nightmare_shade', 'nightmare_shade'), W('nightmare_shade', 'void_wraith', 'mind_flayer'), W('void_wraith', 'purple_worm', 'nightmare_shade'), W('nightmare_shade', 'nightmare_shade', 'void_wraith'), { monsters: ['shade_lord'], isBoss: true }],
  },
  {
    id: 'floor_20', number: 20, name: '虚空终焉 · 第 20 层', icon: '🌌', firstClearReputation: 120,
    waves: [W('void_heart_larva', 'void_heart_larva'), W('void_heart_larva', 'nightmare_shade', 'void_wraith'), W('void_heart_larva', 'void_heart_larva', 'purple_worm'), W('nightmare_shade', 'void_heart_larva', 'void_wraith'), { monsters: ['the_void_heart'], isBoss: true }],
  },
];

export const FLOORS: Record<FloorId, FloorDef> = Object.fromEntries(
  FLOOR_DEFS.map((f) => [f.id, f]),
);

/** 楼层掉落表汇总（情报网掉落预览用） */
export function floorDropTable(floorId: FloorId): Array<{ materialId: MaterialId; from: string[] }> {
  const floor = FLOORS[floorId];
  const map = new Map<string, Set<string>>();
  for (const wave of floor.waves) {
    for (const mid of wave.monsters) {
      for (const d of MONSTERS[mid].drops) {
        if (!map.has(d.materialId)) map.set(d.materialId, new Set());
        map.get(d.materialId)!.add(MONSTERS[mid].name);
      }
    }
  }
  return [...map.entries()].map(([materialId, from]) => ({ materialId, from: [...from] }));
}
