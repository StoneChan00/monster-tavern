import type { ClassId, MonsterId } from '../engine/types';

/**
 * 像素精灵映射（全部来自 Kenney CC0 素材，许可证见各目录 LICENSE.txt）。
 * 魔物：Kenney "Tiny Creatures"（https://opengameart.org/content/tiny-creatures）
 * 角色/地牢图块：Kenney "Tiny Dungeon"（随 Tiny Creatures 包附带）
 * 未映射的条目回退 emoji 图标。
 */

/** 魔物图标 */
export const MONSTER_SPRITES: Partial<Record<MonsterId, string>> = {
  bat: 'bat.png',
  venom_bat: 'venom_bat.png',
  slime: 'slime.png',
  big_slime: 'big_slime.png',
  glow_jelly: 'glow_jelly.png',
  cave_lizard: 'cave_lizard.png',
  basilisk: 'basilisk.png',
  stone_golem: 'stone_golem.png',
  obsidian_golem: 'obsidian_golem.png',
  shadow_spider: 'shadow_spider.png',
  skeleton: 'skeleton.png',
  abyss_tentacle: 'abyss_tentacle.png',
  man_eater: 'man_eater.png',
  moss_wolf: 'moss_wolf.png',
  wraith: 'wraith.png',
  // 水晶回廊（11-20 层）复用素材
  crystal_slime: 'slime.png',
  crystal_bat: 'bat.png',
  gem_golem: 'stone_golem.png',
  void_spider: 'shadow_spider.png',
  ice_lizard: 'cave_lizard.png',
  mind_flayer: 'abyss_tentacle.png',
  void_wraith: 'wraith.png',
  purple_worm: 'basilisk.png',
  nightmare_shade: 'wraith.png',
  void_heart_larva: 'glow_jelly.png',
};

/** 职业角色图标 */
export const CLASS_SPRITES: Partial<Record<ClassId, string>> = {
  warrior: 'warrior.png',
  mage: 'mage.png',
  rogue: 'rogue.png',
  priest: 'priest.png',
  ranger: 'ranger.png',
  bard: 'bard.png',
};

/** 战斗视口地牢图块 */
export const TILE_SPRITES = {
  floor: 'floor.png',
  wall: 'wall.png',
} as const;
