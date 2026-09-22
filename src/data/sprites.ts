import type { MonsterId } from '../engine/types';

/**
 * 魔物像素图标映射。
 * 素材：Kenney "Tiny Creatures"（CC0 1.0 Universal，无需署名）
 * 来源：https://opengameart.org/content/tiny-creatures
 * 许可证全文见 public/sprites/monsters/LICENSE.txt
 * 未映射的魔物（蘑菇/蟹/巨魔等）回退为 emoji 图标，待后续视觉甄别补齐。
 */
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
};
