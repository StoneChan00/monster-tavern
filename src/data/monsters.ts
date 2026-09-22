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

// ── 第 1~2 层魔物（强度基准） ──────────────────────
const SLIME: MonsterDef = {
  id: 'slime', name: '苔原史莱姆', icon: '🟢',
  base: { hp: 30, atk: 6, def: 2, spd: 5 }, exp: 8, gold: 3,
  drops: [{ materialId: 'mat_gel', count: 1, weight: 10 }],
};
const BAT: MonsterDef = {
  id: 'bat', name: '洞穴蝙蝠', icon: '🦇',
  base: { hp: 22, atk: 8, def: 1, spd: 12 }, exp: 9, gold: 4,
  drops: [
    { materialId: 'mat_gel', count: 1, weight: 4 },
    { materialId: 'mat_bat_wing', count: 1, weight: 5 },
  ],
};
const MUSHROOM: MonsterDef = {
  id: 'mushroom', name: '咆哮蘑菇', icon: '🍄',
  base: { hp: 40, atk: 5, def: 6, spd: 3 }, exp: 12, gold: 5,
  drops: [{ materialId: 'mat_carapace', count: 1, weight: 8 }],
};
const SLIME_KING: MonsterDef = {
  id: 'slime_king', name: '史莱姆之王', icon: '👑',
  base: { hp: 150, atk: 10, def: 4, spd: 4 }, exp: 40, gold: 25,
  drops: [
    { materialId: 'mat_gel', count: 3, weight: 10 },
    { materialId: 'mat_carapace', count: 1, weight: 3 },
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
    { materialId: 'mat_bat_wing', count: 1, weight: 6 },
    { materialId: 'mat_gel', count: 1, weight: 3 },
  ],
};
const BAT_LORD: MonsterDef = {
  id: 'bat_lord', name: '双首蝠王', icon: '👑',
  base: { hp: 230, atk: 16, def: 5, spd: 14 }, exp: 60, gold: 40,
  drops: [
    { materialId: 'mat_bat_wing', count: 3, weight: 10 },
    { materialId: 'mat_carapace', count: 2, weight: 4 },
  ],
};

// ── 第 3~4 层魔物 ──────────────────────────────────
const ROCK_CRAB: MonsterDef = {
  id: 'rock_crab', name: '岩壳蟹', icon: '🦀',
  base: { hp: 75, atk: 11, def: 10, spd: 5 }, exp: 26, gold: 9,
  drops: [{ materialId: 'mat_carapace', count: 2, weight: 10 }],
};
const SPORE_MUSHROOM: MonsterDef = {
  id: 'spore_mushroom', name: '孢子蘑菇', icon: '🍄',
  base: { hp: 65, atk: 13, def: 7, spd: 4 }, exp: 24, gold: 8,
  drops: [{ materialId: 'mat_rock_salt', count: 1, weight: 10 }],
};
const CRAB_KING: MonsterDef = {
  id: 'crab_king', name: '岩壳巨蟹', icon: '👑',
  base: { hp: 380, atk: 20, def: 14, spd: 6 }, exp: 110, gold: 70,
  drops: [
    { materialId: 'mat_carapace', count: 4, weight: 10 },
    { materialId: 'mat_rock_salt', count: 2, weight: 6 },
  ],
};
const MOSS_WOLF: MonsterDef = {
  id: 'moss_wolf', name: '苔藓狼', icon: '🐺',
  base: { hp: 90, atk: 18, def: 8, spd: 12 }, exp: 34, gold: 12,
  drops: [
    { materialId: 'mat_bat_wing', count: 1, weight: 4 },
    { materialId: 'mat_carapace', count: 1, weight: 4 },
  ],
};
const CAVE_LIZARD: MonsterDef = {
  id: 'cave_lizard', name: '穴居蜥蜴', icon: '🦎',
  base: { hp: 110, atk: 15, def: 12, spd: 7 }, exp: 36, gold: 13,
  drops: [
    { materialId: 'mat_rock_salt', count: 1, weight: 6 },
    { materialId: 'mat_carapace', count: 1, weight: 3 },
  ],
};
const WOLF_ALPHA: MonsterDef = {
  id: 'wolf_alpha', name: '苔藓狼王', icon: '👑',
  base: { hp: 520, atk: 26, def: 12, spd: 14 }, exp: 180, gold: 120,
  drops: [
    { materialId: 'mat_bat_wing', count: 3, weight: 10 },
    { materialId: 'mat_rock_salt', count: 2, weight: 5 },
  ],
};

// ── 第 5~6 层魔物（秘银矿道 / 暗影回廊） ──────────
const GLOW_JELLY: MonsterDef = {
  id: 'glow_jelly', name: '幽光水母', icon: '🪼',
  base: { hp: 120, atk: 22, def: 10, spd: 9 }, exp: 48, gold: 17,
  drops: [{ materialId: 'mat_gel', count: 3, weight: 10 }],
};
const STONE_GOLEM: MonsterDef = {
  id: 'stone_golem', name: '石皮傀儡', icon: '🗿',
  base: { hp: 180, atk: 20, def: 20, spd: 4 }, exp: 55, gold: 20,
  drops: [
    { materialId: 'mat_mithril', count: 1, weight: 6 },
    { materialId: 'mat_carapace', count: 2, weight: 4 },
  ],
};
const GOLEM_GUARD: MonsterDef = {
  id: 'golem_guard', name: '傀儡守卫', icon: '👑',
  base: { hp: 750, atk: 32, def: 24, spd: 5 }, exp: 260, gold: 180,
  drops: [
    { materialId: 'mat_mithril', count: 2, weight: 10 },
    { materialId: 'mat_carapace', count: 4, weight: 5 },
  ],
};
const SHADOW_SPIDER: MonsterDef = {
  id: 'shadow_spider', name: '暗影蜘蛛', icon: '🕷️',
  base: { hp: 140, atk: 28, def: 12, spd: 15 }, exp: 66, gold: 23,
  drops: [
    { materialId: 'mat_bat_wing', count: 2, weight: 6 },
    { materialId: 'mat_rock_salt', count: 1, weight: 4 },
  ],
};
const IRON_BEETLE: MonsterDef = {
  id: 'iron_beetle', name: '铁甲甲虫', icon: '🪲',
  base: { hp: 200, atk: 24, def: 24, spd: 6 }, exp: 70, gold: 26,
  drops: [
    { materialId: 'mat_mithril', count: 1, weight: 8 },
    { materialId: 'mat_carapace', count: 3, weight: 5 },
  ],
};
const WEAVER_QUEEN: MonsterDef = {
  id: 'weaver_queen', name: '织网妖后', icon: '👑',
  base: { hp: 900, atk: 40, def: 18, spd: 16 }, exp: 340, gold: 240,
  drops: [
    { materialId: 'mat_mithril', count: 3, weight: 10 },
    { materialId: 'mat_bat_wing', count: 4, weight: 5 },
  ],
};

// ── 第 7~8 层魔物（骸骨墓穴 / 熔岩裂隙） ──────────
const MAN_EATER: MonsterDef = {
  id: 'man_eater', name: '食人花', icon: '🌺',
  base: { hp: 180, atk: 34, def: 16, spd: 8 }, exp: 88, gold: 31,
  drops: [{ materialId: 'mat_gel', count: 4, weight: 10 }],
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
    { materialId: 'mat_mithril', count: 4, weight: 10 },
    { materialId: 'mat_core', count: 1, weight: 4 },
  ],
};
const CAVE_TROLL: MonsterDef = {
  id: 'cave_troll', name: '洞穴巨魔', icon: '👹',
  base: { hp: 300, atk: 44, def: 22, spd: 7 }, exp: 120, gold: 44,
  drops: [
    { materialId: 'mat_carapace', count: 4, weight: 6 },
    { materialId: 'mat_mithril', count: 1, weight: 4 },
  ],
};
const ACID_SLIME: MonsterDef = {
  id: 'acid_slime', name: '酸液史莱姆', icon: '🫧',
  base: { hp: 240, atk: 40, def: 18, spd: 8 }, exp: 110, gold: 40,
  drops: [
    { materialId: 'mat_gel', count: 6, weight: 8 },
    { materialId: 'mat_rock_salt', count: 2, weight: 5 },
  ],
};
const TROLL_WARLORD: MonsterDef = {
  id: 'troll_warlord', name: '巨魔督军', icon: '👑',
  base: { hp: 1400, atk: 58, def: 28, spd: 8 }, exp: 560, gold: 420,
  drops: [
    { materialId: 'mat_mithril', count: 5, weight: 10 },
    { materialId: 'mat_core', count: 1, weight: 4 },
  ],
};

// ── 第 9~10 层魔物（幽魂深渊 / 深渊之心） ──────────
const WRAITH: MonsterDef = {
  id: 'wraith', name: '幽魂', icon: '👻',
  base: { hp: 260, atk: 52, def: 20, spd: 18 }, exp: 150, gold: 55,
  drops: [
    { materialId: 'mat_core', count: 1, weight: 2 },
    { materialId: 'mat_gel', count: 2, weight: 6 },
  ],
};
const SHADOW_HUNTER: MonsterDef = {
  id: 'shadow_hunter', name: '暗影猎手', icon: '🌑',
  base: { hp: 300, atk: 50, def: 24, spd: 14 }, exp: 155, gold: 58,
  drops: [
    { materialId: 'mat_mithril', count: 2, weight: 7 },
    { materialId: 'mat_bat_wing', count: 4, weight: 5 },
  ],
};
const BASILISK: MonsterDef = {
  id: 'basilisk', name: '石化蜥蜴', icon: '🐍',
  base: { hp: 340, atk: 46, def: 30, spd: 9 }, exp: 160, gold: 60,
  drops: [
    { materialId: 'mat_mithril', count: 3, weight: 8 },
    { materialId: 'mat_rock_salt', count: 3, weight: 6 },
  ],
};
const WRAITH_LORD: MonsterDef = {
  id: 'wraith_lord', name: '幽魂领主', icon: '👑',
  base: { hp: 1700, atk: 66, def: 26, spd: 19 }, exp: 700, gold: 540,
  drops: [
    { materialId: 'mat_core', count: 2, weight: 10 },
    { materialId: 'mat_mithril', count: 4, weight: 6 },
  ],
};
const ABYSS_TENTACLE: MonsterDef = {
  id: 'abyss_tentacle', name: '深渊触手', icon: '🐙',
  base: { hp: 380, atk: 60, def: 26, spd: 11 }, exp: 200, gold: 75,
  drops: [
    { materialId: 'mat_core', count: 1, weight: 3 },
    { materialId: 'mat_gel', count: 4, weight: 7 },
  ],
};
const OBSIDIAN_GOLEM: MonsterDef = {
  id: 'obsidian_golem', name: '黑曜石魔像', icon: '🗿',
  base: { hp: 450, atk: 56, def: 36, spd: 6 }, exp: 210, gold: 80,
  drops: [
    { materialId: 'mat_core', count: 1, weight: 3 },
    { materialId: 'mat_mithril', count: 4, weight: 7 },
  ],
};
const NIGHTMARE: MonsterDef = {
  id: 'nightmare', name: '深渊守护者·梦魇', icon: '🌌',
  base: { hp: 2200, atk: 78, def: 34, spd: 13 }, exp: 900, gold: 700,
  drops: [
    { materialId: 'mat_core', count: 3, weight: 10 },
    { materialId: 'mat_mithril', count: 6, weight: 6 },
  ],
};

export const MONSTERS: Record<MonsterId, MonsterDef> = Object.fromEntries(
  [
    SLIME, BAT, MUSHROOM, SLIME_KING, BIG_SLIME, VENOM_BAT, BAT_LORD,
    ROCK_CRAB, SPORE_MUSHROOM, CRAB_KING, MOSS_WOLF, CAVE_LIZARD, WOLF_ALPHA,
    GLOW_JELLY, STONE_GOLEM, GOLEM_GUARD, SHADOW_SPIDER, IRON_BEETLE, WEAVER_QUEEN,
    MAN_EATER, SKELETON, SKELETON_CAPTAIN, CAVE_TROLL, ACID_SLIME, TROLL_WARLORD,
    WRAITH, SHADOW_HUNTER, BASILISK, WRAITH_LORD, ABYSS_TENTACLE, OBSIDIAN_GOLEM, NIGHTMARE,
  ].map((m) => [m.id, m]),
);

export interface WaveDef {
  monsters: MonsterId[];
  isBoss?: boolean;
}

export interface FloorDef {
  id: FloorId;
  /** 层数（1~10） */
  number: number;
  name: string;
  icon: string;
  waves: WaveDef[];
  /** 首杀层底 BOSS 获得的声望 */
  firstClearReputation: number;
}

/** 楼层 ID 规则：floor_<number>（v1 的 floor_mossy 在迁移中映射到 floor_1） */
export function floorIdOf(number: number): FloorId {
  return `floor_${number}`;
}

export const FLOOR_DEFS: FloorDef[] = [
  {
    id: 'floor_1', number: 1, name: '苔藓洞窟 · 第 1 层', icon: '🕳️',
    firstClearReputation: 5,
    waves: [
      { monsters: ['slime', 'slime'] },
      { monsters: ['slime', 'slime', 'bat'] },
      { monsters: ['bat', 'bat', 'mushroom'] },
      { monsters: ['mushroom', 'mushroom', 'slime', 'slime'] },
      { monsters: ['slime_king'], isBoss: true },
    ],
  },
  {
    id: 'floor_2', number: 2, name: '苔藓洞窟 · 第 2 层', icon: '🕳️',
    firstClearReputation: 8,
    waves: [
      { monsters: ['big_slime', 'big_slime'] },
      { monsters: ['big_slime', 'venom_bat', 'venom_bat'] },
      { monsters: ['venom_bat', 'venom_bat', 'mushroom'] },
      { monsters: ['big_slime', 'big_slime', 'venom_bat'] },
      { monsters: ['bat_lord'], isBoss: true },
    ],
  },
  {
    id: 'floor_3', number: 3, name: '苔藓洞窟 · 第 3 层', icon: '🕳️',
    firstClearReputation: 12,
    waves: [
      { monsters: ['rock_crab', 'rock_crab'] },
      { monsters: ['rock_crab', 'spore_mushroom'] },
      { monsters: ['spore_mushroom', 'spore_mushroom', 'bat'] },
      { monsters: ['rock_crab', 'rock_crab', 'spore_mushroom'] },
      { monsters: ['crab_king'], isBoss: true },
    ],
  },
  {
    id: 'floor_4', number: 4, name: '苔藓洞窟 · 第 4 层', icon: '🌿',
    firstClearReputation: 16,
    waves: [
      { monsters: ['moss_wolf', 'moss_wolf'] },
      { monsters: ['moss_wolf', 'moss_wolf', 'cave_lizard'] },
      { monsters: ['cave_lizard', 'cave_lizard', 'rock_crab'] },
      { monsters: ['moss_wolf', 'moss_wolf', 'cave_lizard'] },
      { monsters: ['wolf_alpha'], isBoss: true },
    ],
  },
  {
    id: 'floor_5', number: 5, name: '秘银矿道 · 第 5 层', icon: '⛏️',
    firstClearReputation: 20,
    waves: [
      { monsters: ['glow_jelly', 'glow_jelly'] },
      { monsters: ['glow_jelly', 'stone_golem'] },
      { monsters: ['stone_golem', 'glow_jelly', 'glow_jelly'] },
      { monsters: ['stone_golem', 'stone_golem', 'moss_wolf'] },
      { monsters: ['golem_guard'], isBoss: true },
    ],
  },
  {
    id: 'floor_6', number: 6, name: '暗影回廊 · 第 6 层', icon: '🕸️',
    firstClearReputation: 25,
    waves: [
      { monsters: ['shadow_spider', 'shadow_spider'] },
      { monsters: ['shadow_spider', 'iron_beetle'] },
      { monsters: ['iron_beetle', 'iron_beetle', 'shadow_spider'] },
      { monsters: ['shadow_spider', 'shadow_spider', 'iron_beetle'] },
      { monsters: ['weaver_queen'], isBoss: true },
    ],
  },
  {
    id: 'floor_7', number: 7, name: '骸骨墓穴 · 第 7 层', icon: '💀',
    firstClearReputation: 30,
    waves: [
      { monsters: ['skeleton', 'skeleton'] },
      { monsters: ['man_eater', 'skeleton'] },
      { monsters: ['man_eater', 'man_eater', 'shadow_spider'] },
      { monsters: ['skeleton', 'skeleton', 'man_eater'] },
      { monsters: ['skeleton_captain'], isBoss: true },
    ],
  },
  {
    id: 'floor_8', number: 8, name: '熔岩裂隙 · 第 8 层', icon: '🔥',
    firstClearReputation: 36,
    waves: [
      { monsters: ['acid_slime', 'acid_slime'] },
      { monsters: ['cave_troll', 'acid_slime'] },
      { monsters: ['cave_troll', 'cave_troll', 'iron_beetle'] },
      { monsters: ['cave_troll', 'acid_slime', 'acid_slime'] },
      { monsters: ['troll_warlord'], isBoss: true },
    ],
  },
  {
    id: 'floor_9', number: 9, name: '幽魂深渊 · 第 9 层', icon: '👻',
    firstClearReputation: 42,
    waves: [
      { monsters: ['wraith', 'wraith'] },
      { monsters: ['basilisk', 'shadow_hunter'] },
      { monsters: ['wraith', 'basilisk', 'shadow_hunter'] },
      { monsters: ['shadow_hunter', 'basilisk', 'wraith'] },
      { monsters: ['wraith_lord'], isBoss: true },
    ],
  },
  {
    id: 'floor_10', number: 10, name: '深渊之心 · 第 10 层', icon: '🌌',
    firstClearReputation: 50,
    waves: [
      { monsters: ['abyss_tentacle', 'abyss_tentacle'] },
      { monsters: ['obsidian_golem', 'abyss_tentacle'] },
      { monsters: ['obsidian_golem', 'obsidian_golem', 'wraith'] },
      { monsters: ['abyss_tentacle', 'abyss_tentacle', 'obsidian_golem'] },
      { monsters: ['nightmare'], isBoss: true },
    ],
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
