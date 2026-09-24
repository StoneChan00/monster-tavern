import { BALANCE } from './balance';
import type { RecipeUnlock } from './balance';
import type { BuffStat, ClassId, MaterialId, RecipeId } from '../engine/types';

/** 菜品类别（厨房菜单结构用：前菜/汤/副菜/主菜/沙拉/甜点/饮品） */
export type RecipeCategory =
  | 'appetizer'
  | 'soup'
  | 'side'
  | 'main'
  | 'salad'
  | 'dessert'
  | 'drink';

export const CATEGORY_LABEL: Record<RecipeCategory, string> = {
  appetizer: '前菜',
  soup: '汤',
  side: '副菜',
  main: '主菜',
  salad: '沙拉',
  dessert: '甜点',
  drink: '饮品',
};

export interface RecipeDef {
  id: RecipeId;
  name: string;
  icon: string;
  /** 迷宫饭式风味文本 */
  desc: string;
  category: RecipeCategory;
  cost: {
    gold: number;
    /** 主材（魔物部位）+ 辅材 + 调味（岩盐） */
    materials: Partial<Record<MaterialId, number>>;
  };
  buff: {
    stat: BuffStat;
    mult: number;
    label: string;
  };
  /** 出餐时冒险者获得的忠诚度 */
  mealLoyalty: number;
  /** 解锁后提升对应职业冒险者的到访权重（美食即招募） */
  attraction: { classIds: ClassId[]; weight: number };
  unlock: RecipeUnlock;
}

/**
 * 菜谱体系（迷宫饭式）：主材 = 魔物部位，辅材调味 = 岩盐/凝胶等。
 * v7 菜单制：菜品上菜单后每小时消耗材料维持效果，菜单结构满足时才生效。
 * 旧 ID 全部保留以继承玩家解锁进度。
 */
export const RECIPES: Record<RecipeId, RecipeDef> = {
  recipe_gel_soup: {
    id: 'recipe_gel_soup',
    name: '史莱姆凝胶浓汤',
    icon: '🍲',
    desc: '去除杂质的凝胶在舌尖弹跳，一路暖到胃里。汉克说这是家的味道。',
    category: 'soup',
    cost: { gold: 10, materials: { mat_gel: 3 } },
    buff: { stat: 'atk', mult: 1.25, label: 'ATK +25%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['priest'], weight: 3 },
    unlock: { type: 'initial' },
  },
  recipe_bat_wings: {
    id: 'recipe_bat_wings',
    name: '香烤蝙蝠翅',
    icon: '🍗',
    desc: '翼膜刷上岩盐炙烤，外脆里嫩。洞穴烧烤摊的招牌，一串难求。',
    category: 'appetizer',
    cost: { gold: 15, materials: { mat_bat_wing: 2, mat_rock_salt: 1 } },
    buff: { stat: 'atk', mult: 1.35, label: 'ATK +35%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior', 'ranger'], weight: 4 },
    unlock: { type: 'initial' },
  },
  recipe_carapace_chips: {
    id: 'recipe_carapace_chips',
    name: '咔嚓甲壳脆片',
    icon: '🥨',
    desc: '薄切甲壳低温慢炸，撒上岩盐。盗贼们下酒的最爱，咬一口"咔嚓"作响。',
    category: 'appetizer',
    cost: { gold: 10, materials: { mat_carapace: 2, mat_rock_salt: 1 } },
    buff: { stat: 'dropRate', mult: 1.2, label: '掉落率 +20%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue'], weight: 4 },
    unlock: { type: 'mapClear', map: 1 },
  },
  recipe_mushroom_soup: {
    id: 'recipe_mushroom_soup',
    name: '咆哮菌菇炖汤',
    icon: '🥣',
    desc: '菌伞的鲜味被凝胶牢牢锁住，炖到蘑菇忘记自己曾经咆哮过。',
    category: 'soup',
    cost: { gold: 20, materials: { mat_mushroom_cap: 2, mat_gel: 1, mat_rock_salt: 1 } },
    buff: { stat: 'hp', mult: 1.3, label: 'HP 上限 +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['priest'], weight: 5 },
    unlock: { type: 'mapClear', map: 1 },
  },
  recipe_crab_claws: {
    id: 'recipe_crab_claws',
    name: '香炸岩壳蟹钳',
    icon: '🦀',
    desc: '连壳带肉一口咬下，岩盐激出海洋的幻觉。防守反击的味道。',
    category: 'side',
    cost: { gold: 25, materials: { mat_crab_claw: 2, mat_rock_salt: 2 } },
    buff: { stat: 'spd', mult: 1.2, label: 'SPD +20%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue'], weight: 5 },
    unlock: { type: 'mapClear', map: 1 },
  },
  recipe_beast_roast: {
    id: 'recipe_beast_roast',
    name: '狼排佐菌菇',
    icon: '🍖',
    desc: '苔藓狼排慢火煎出焦边，铺上炖软的菌菇。大口吃肉的豪迈。',
    category: 'main',
    cost: { gold: 35, materials: { mat_wolf_meat: 2, mat_mushroom_cap: 1, mat_rock_salt: 1 } },
    buff: { stat: 'atk', mult: 1.5, label: 'ATK +50%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior', 'ranger'], weight: 6 },
    unlock: { type: 'mapClear', map: 1 },
  },
  recipe_pudding: {
    id: 'recipe_pudding',
    name: '幽光水母凉粉',
    icon: '🍮',
    desc: '触腕与凝胶同炖放凉，颤巍巍地泛着微光。深夜酒馆最治愈的一道。',
    category: 'dessert',
    cost: { gold: 30, materials: { mat_jelly_tentacle: 3, mat_gel: 1 } },
    buff: { stat: 'hp', mult: 1.5, label: 'HP 上限 +50%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage'], weight: 5 },
    unlock: { type: 'mapClear', map: 2 },
  },
  recipe_gummy: {
    id: 'recipe_gummy',
    name: '高纯度凝胶软糖',
    icon: '🍬',
    desc: '六份凝胶熬成一份糖，弹牙得能当暗器。法师们写作时的续命粮。',
    category: 'dessert',
    cost: { gold: 40, materials: { mat_gel: 6 } },
    buff: { stat: 'spd', mult: 1.3, label: 'SPD +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage'], weight: 4 },
    unlock: { type: 'mapClear', map: 2 },
  },
  recipe_mush_wine: {
    id: 'recipe_mush_wine',
    name: '花蜜蜜酒',
    icon: '🍷',
    desc: '一滴食人花蜜兑三勺凝胶酒液。甜里藏着一点点危险，诗人为它写了三首歌。',
    category: 'drink',
    cost: { gold: 45, materials: { mat_flower_honey: 2, mat_gel: 1, mat_rock_salt: 1 } },
    buff: { stat: 'expGain', mult: 1.35, label: '经验获取 +35%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['bard'], weight: 5 },
    unlock: { type: 'mapClear', map: 4 },
  },
  recipe_elixir: {
    id: 'recipe_elixir',
    name: '巨魔督军盛宴',
    icon: '🥩',
    desc: '巨魔肉排与狼肉层层码放，食客相信伤口会愈合得更快——通常是真的。',
    category: 'main',
    cost: { gold: 60, materials: { mat_troll_steak: 1, mat_wolf_meat: 2, mat_rock_salt: 2 } },
    buff: { stat: 'atk', mult: 1.6, label: 'ATK +60%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior', 'ranger'], weight: 6 },
    unlock: { type: 'mapClear', map: 4 },
  },
  recipe_wraith_souffle: {
    id: 'recipe_wraith_souffle',
    name: '幽魂舒芙蕾',
    icon: '🍥',
    desc: '残息在齿间化作一阵凉雾，回味是某位陌生人的一生。吃掉执念，让他安息。',
    category: 'dessert',
    cost: { gold: 70, materials: { mat_wraith_essence: 2, mat_gel: 3 } },
    buff: { stat: 'expGain', mult: 1.35, label: '经验获取 +35%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['priest', 'mage'], weight: 5 },
    unlock: { type: 'mapClear', map: 4 },
  },
  recipe_crystal_salad: {
    id: 'recipe_crystal_salad',
    name: '晶光水晶冻',
    icon: '💠',
    desc: '晶核冻切成菱形，岩盐提味。咬破的瞬间，整个口腔都在叮当作响。',
    category: 'salad',
    cost: { gold: 50, materials: { mat_crystal_jelly: 3, mat_rock_salt: 1 } },
    buff: { stat: 'atk', mult: 1.45, label: 'ATK +45%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage'], weight: 5 },
    unlock: { type: 'mapClear', map: 5 },
  },
  recipe_void_stew: {
    id: 'recipe_void_stew',
    name: '虚空安魂浓汤',
    icon: '🍲',
    desc: '暗色精华在汤面上旋出星云。喝下它的人说，听见了很远很远的声音。',
    category: 'soup',
    cost: { gold: 80, materials: { mat_void_essence: 2, mat_crystal_jelly: 2 } },
    buff: { stat: 'expGain', mult: 1.45, label: '经验获取 +45%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['bard'], weight: 6 },
    unlock: { type: 'mapClear', map: 5 },
  },
  recipe_flayer_bisque: {
    id: 'recipe_flayer_bisque',
    name: '灵吸怪浓汤',
    icon: '🍜',
    desc: '深渊触腕炖到酥烂，汤色是介于紫与黑之间的颜色。别问鲜味从哪来。',
    category: 'soup',
    cost: { gold: 90, materials: { mat_abyss_tentacle: 2, mat_crystal_jelly: 1, mat_rock_salt: 2 } },
    buff: { stat: 'spd', mult: 1.4, label: 'SPD +40%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue'], weight: 6 },
    unlock: { type: 'mapClear', map: 6 },
  },
  recipe_dragon_feast: {
    id: 'recipe_dragon_feast',
    name: '屠龙者盛宴',
    icon: '🍢',
    desc: '为击败晶龙的队伍准备的庆功宴：巨魔排、狼肉串与晶冻甜点，摆成一条龙的形状。',
    category: 'main',
    cost: { gold: 150, materials: { mat_troll_steak: 1, mat_wolf_meat: 2, mat_crystal_jelly: 2 } },
    buff: { stat: 'atk', mult: 1.75, label: 'ATK +75%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior', 'ranger'], weight: 7 },
    unlock: { type: 'mapClear', map: 6 },
  },
  recipe_void_banquet: {
    id: 'recipe_void_banquet',
    name: '虚空之心全席',
    icon: '🎉',
    desc: '用虚空之心的馈赠做出的终极宴席。吃完的人会短暂看见世界的底色——然后想再吃一次。',
    category: 'main',
    cost: { gold: 250, materials: { mat_void_essence: 3, mat_core: 2, mat_flower_honey: 2 } },
    buff: { stat: 'def', mult: 1.6, label: 'DEF +60%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['bard', 'mage'], weight: 7 },
    unlock: { type: 'mapClear', map: 6 },
  },

  // ── v7 菜单制扩充（补齐七大类，前中期即可组出结构） ──
  recipe_gel_soda: {
    id: 'recipe_gel_soda',
    name: '凝胶汽水',
    icon: '🥤',
    desc: '凝胶兑气泡水再加一撮岩盐，气泡在舌尖炸开。矿工们下班后的第一口。',
    category: 'drink',
    cost: { gold: 12, materials: { mat_gel: 2, mat_rock_salt: 1 } },
    buff: { stat: 'hp', mult: 1.15, label: 'HP 上限 +15%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue', 'bard'], weight: 3 },
    unlock: { type: 'initial' },
  },
  recipe_lizard_skewer: {
    id: 'recipe_lizard_skewer',
    name: '岩盐烤蜥尾串',
    icon: '🍢',
    desc: '蜥蜴尾刷油炭烤，胶质在火里收缩成一层脆壳。三串起步，不然不够分。',
    category: 'side',
    cost: { gold: 20, materials: { mat_lizard_tail: 2, mat_rock_salt: 1 } },
    buff: { stat: 'spd', mult: 1.15, label: 'SPD +15%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['ranger'], weight: 4 },
    unlock: { type: 'mapClear', map: 1 },
  },
  recipe_jelly_salad: {
    id: 'recipe_jelly_salad',
    name: '幽光触腕沙拉',
    icon: '🥗',
    desc: '水母触腕焯水冰镇，拌入晶冻丁。在黑暗里发光的沙拉，吃得人心里发亮。',
    category: 'salad',
    cost: { gold: 30, materials: { mat_jelly_tentacle: 2, mat_gel: 1 } },
    buff: { stat: 'dropRate', mult: 1.15, label: '掉落率 +15%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage', 'priest'], weight: 4 },
    unlock: { type: 'mapClear', map: 2 },
  },
  recipe_honey_milk: {
    id: 'recipe_honey_milk',
    name: '温热蜜乳',
    icon: '🥛',
    desc: '食人花蜜温热入杯，睡前一杯，梦里的魔物都会变得温顺。',
    category: 'drink',
    cost: { gold: 40, materials: { mat_flower_honey: 1, mat_gel: 2 } },
    buff: { stat: 'expGain', mult: 1.2, label: '经验获取 +20%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['priest', 'bard'], weight: 4 },
    unlock: { type: 'mapClear', map: 3 },
  },
  recipe_wraith_ice: {
    id: 'recipe_wraith_ice',
    name: '幽魂霜糕',
    icon: '🍦',
    desc: '残息冻进凝胶里，像琥珀封存了一声叹息。含在嘴里，凉意直透后颈。',
    category: 'dessert',
    cost: { gold: 55, materials: { mat_wraith_essence: 1, mat_gel: 2 } },
    buff: { stat: 'spd', mult: 1.2, label: 'SPD +20%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue', 'mage'], weight: 5 },
    unlock: { type: 'mapClear', map: 4 },
  },
  recipe_abyss_skewer: {
    id: 'recipe_abyss_skewer',
    name: '深渊炙触串',
    icon: '🍡',
    desc: '深渊触腕切段猛火快炙，边缘卷起焦糖色的脆边。吃的时候请闭上眼睛。',
    category: 'side',
    cost: { gold: 70, materials: { mat_abyss_tentacle: 1, mat_crystal_jelly: 1, mat_rock_salt: 1 } },
    buff: { stat: 'atk', mult: 1.3, label: 'ATK +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior'], weight: 5 },
    unlock: { type: 'mapClear', map: 5 },
  },
  recipe_crystal_soda: {
    id: 'recipe_crystal_soda',
    name: '晶尘气泡饮',
    icon: '🧃',
    desc: '晶核冻磨成粉撒进气泡水，每一口都像喝下了一小片星空。',
    category: 'drink',
    cost: { gold: 60, materials: { mat_crystal_jelly: 2, mat_rock_salt: 1 } },
    buff: { stat: 'expGain', mult: 1.25, label: '经验获取 +25%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage'], weight: 5 },
    unlock: { type: 'mapClear', map: 5 },
  },
  recipe_dragon_candy: {
    id: 'recipe_dragon_candy',
    name: '龙鳞糖衣果',
    icon: '🍭',
    desc: '晶冻裹蜜熬成糖衣，咬开时"咔"的一声像龙鳞碎裂。孩子们不敢吃，大人们抢着吃。',
    category: 'dessert',
    cost: { gold: 100, materials: { mat_crystal_jelly: 2, mat_flower_honey: 1 } },
    buff: { stat: 'def', mult: 1.3, label: 'DEF +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['bard', 'priest'], weight: 6 },
    unlock: { type: 'mapClear', map: 6 },
  },
};

/** 初始已解锁的菜谱 */
export function initialUnlockedRecipes(): RecipeId[] {
  return Object.values(RECIPES)
    .filter((r) => r.unlock.type === 'initial')
    .map((r) => r.id);
}
