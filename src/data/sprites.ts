import { MONSTERS } from './monsters';
import { CLASSES } from './classes';

/**
 * 像素精灵映射（全部 CC0）。素材原始包与切片流程见 assets/README.md。
 *
 * 魔物/职业：Kenney "Tiny Creatures"（Clint Bellanger，经 Kenney 授权）
 *   —— 从官方 packed tilemap 按 17×17 格切片：棕底格抠背景色（描边完好）；
 *      紫底格洪泛抠除 + 原位还原描边内层 + 1px 外扩描边外层 + 回填内部细节。
 * 地板：Kenney "Tiny Dungeon" 官方独立 tile（全铺纹理，每图 2 基底 + 1 点缀，见 MAP_DEFS）。
 * 文件完整性由 tests/engine.test.ts 的「精灵贴图完整性」用例守护。
 */

/**
 * 魔物图标（53 种全覆盖；键类型取自 MONSTERS，漏配会编译报错）。
 * 同图内不重复借形；跨图复用（如 arachni/蜘蛛系、clay/iron 魔像系）由 tint 与主题区分。
 */
export const MONSTER_SPRITES: Record<keyof typeof MONSTERS, string> = {
  // ── 图1 苔藓洞窟 ──
  slime: 'slime.png', // 史莱姆
  big_slime: 'big_slime.png', // 大型凝胶方块
  slime_king: 'slime_king.png', // 淤泥之王（加冕）
  mushroom: 'mushroom.png', // 蘑菇人
  spore_mushroom: 'spore_mushroom.png', // 灌木怪
  bat: 'bat.png', // 蝙蝠（振翅）
  venom_bat: 'venom_bat.png', // 巨蚊
  bat_lord: 'bat_lord.png', // 吸血鬼
  rock_crab: 'rock_crab.png', // 蝎（钳形）
  crab_king: 'crab_king.png', // 大甲虫
  moss_wolf: 'moss_wolf.png', // 狼
  wolf_alpha: 'wolf_alpha.png', // 狼人
  cave_lizard: 'cave_lizard.png', // 蜥蜴
  // ── 图2 秘银矿道 ──
  glow_jelly: 'glow_jelly.png', // 鬼火
  stone_golem: 'stone_golem.png', // 石魔像
  golem_guard: 'golem_guard.png', // 黏土魔像
  shadow_spider: 'shadow_spider.png', // 蜘蛛
  iron_beetle: 'iron_beetle.png', // 蜈蚣
  weaver_queen: 'weaver_queen.png', // 美杜莎（蛇发妖后）
  // ── 图3 骸骨墓穴 ──
  skeleton: 'skeleton.png', // 骷髅
  skeleton_captain: 'skeleton_captain.png', // 尸骸武士
  man_eater: 'man_eater.png', // 食人花
  // ── 图4 熔岩裂隙 ──
  acid_slime: 'acid_slime.png', // 小团凝胶
  cave_troll: 'cave_troll.png', // 巨魔
  troll_warlord: 'troll_warlord.png', // 食人魔督军
  wraith: 'wraith.png', // 幽魂
  shadow_hunter: 'shadow_hunter.png', // 潜行猫
  basilisk: 'basilisk.png', // 鳄（石化巨蜥）
  abyss_tentacle: 'abyss_tentacle.png', // 克苏鲁触手
  obsidian_golem: 'obsidian_golem.png', // 铁魔像
  wraith_lord: 'wraith_lord.png', // 巫妖
  nightmare: 'nightmare.png', // 梦魇梦魇（黑马）
  // ── 图5 水晶回廊 ──
  crystal_slime: 'crystal_slime.png', // 幼年凝胶方块
  crystal_bat: 'crystal_bat.png', // 蝙蝠（收翼）
  crystal_mother: 'crystal_mother.png', // 史莱姆女王（母体）
  void_spider: 'void_spider.png', // 蜘蛛（复用）
  ice_lizard: 'ice_lizard.png', // 甲龟（冰甲蜥）
  gem_golem: 'gem_golem.png', // 黏土魔像（复用）
  gem_titan: 'gem_titan.png', // 铁魔像（复用）
  amethyst_beetle: 'amethyst_beetle.png', // 蚁
  crystal_beetle_king: 'crystal_beetle_king.png', // 大甲虫（复用）
  void_weaver: 'void_weaver.png', // 章鱼怪（编织者）
  frost_basilisk: 'frost_basilisk.png', // 那迦（冰霜蛇后）
  // ── 图6 虚空终焉 ──
  mind_flayer: 'mind_flayer.png', // 黑袍巫师
  elder_flayer: 'elder_flayer.png', // 奥丁之眼
  void_wraith: 'void_wraith.png', // 报丧女妖
  purple_worm: 'purple_worm.png', // 巨紫蠕虫
  nightmare_shade: 'nightmare_shade.png', // 食尸鬼
  void_heart_larva: 'void_heart_larva.png', // 小天使（核心幼体）
  crystal_dragon: 'crystal_dragon.png', // 蓝龙
  shade_lord: 'shade_lord.png', // 恶魔
  void_reaper: 'void_reaper.png', // 死亡骑士
  the_void_heart: 'the_void_heart.png', // 神明（终焉之心）
};

/** 职业角色图标（键类型取自 CLASSES；红骑士/女巫/天使/猫人/半人马/萨提尔） */
export const CLASS_SPRITES: Record<keyof typeof CLASSES, string> = {
  warrior: 'warrior.png',
  mage: 'mage.png',
  rogue: 'rogue.png',
  priest: 'priest.png',
  ranger: 'ranger.png',
  bard: 'bard.png',
};
