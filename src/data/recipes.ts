import { BALANCE } from './balance';
import type { RecipeUnlock } from './balance';
import type { BuffStat, ClassId, MaterialId, RecipeId } from '../engine/types';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  icon: string;
  cost: {
    gold: number;
    materials: Partial<Record<MaterialId, number>>;
  };
  cookTimeS: number;
  buff: {
    stat: BuffStat;
    mult: number;
    durationS: number;
    label: string;
  };
  /** 出餐时冒险者获得的忠诚度 */
  mealLoyalty: number;
  /** 解锁后提升对应职业冒险者的到访权重（美食即招募） */
  attraction: { classIds: ClassId[]; weight: number };
  unlock: RecipeUnlock;
}

export const RECIPES: Record<RecipeId, RecipeDef> = {
  recipe_gel_soup: {
    id: 'recipe_gel_soup',
    name: '魔物凝胶浓汤',
    icon: '🍲',
    cost: { gold: 10, materials: { mat_gel: 3 } },
    cookTimeS: 600,
    buff: { stat: 'atk', mult: 1.25, durationS: 600, label: 'ATK +25%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['priest'], weight: 3 },
    unlock: { type: 'initial' },
  },
  recipe_bat_wings: {
    id: 'recipe_bat_wings',
    name: '香烤蝙蝠翅',
    icon: '🍗',
    cost: { gold: 15, materials: { mat_bat_wing: 3 } },
    cookTimeS: 1200,
    buff: { stat: 'atk', mult: 1.35, durationS: 1200, label: 'ATK +35%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior', 'ranger'], weight: 4 },
    unlock: { type: 'initial' },
  },
  recipe_carapace_chips: {
    id: 'recipe_carapace_chips',
    name: '脆脆甲壳片',
    icon: '🥨',
    cost: { gold: 10, materials: { mat_carapace: 2 } },
    cookTimeS: 1200,
    buff: { stat: 'dropRate', mult: 1.2, durationS: 1200, label: '掉落率 +20%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue'], weight: 4 },
    unlock: { type: 'floorClear', floor: 2 },
  },
  recipe_mushroom_soup: {
    id: 'recipe_mushroom_soup',
    name: '洞窟菌菇汤',
    icon: '🥣',
    cost: { gold: 20, materials: { mat_gel: 2, mat_rock_salt: 2 } },
    cookTimeS: 900,
    buff: { stat: 'hp', mult: 1.3, durationS: 900, label: 'HP 上限 +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['priest'], weight: 5 },
    unlock: { type: 'floorClear', floor: 3 },
  },
  recipe_crab_claws: {
    id: 'recipe_crab_claws',
    name: '香炸蟹钳',
    icon: '🦀',
    cost: { gold: 15, materials: { mat_carapace: 3, mat_rock_salt: 1 } },
    cookTimeS: 900,
    buff: { stat: 'spd', mult: 1.2, durationS: 900, label: 'SPD +20%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['rogue'], weight: 5 },
    unlock: { type: 'floorClear', floor: 4 },
  },
  recipe_pudding: {
    id: 'recipe_pudding',
    name: '魔素布丁',
    icon: '🍮',
    cost: { gold: 20, materials: { mat_gel: 4, mat_rock_salt: 1 } },
    cookTimeS: 1800,
    buff: { stat: 'atk', mult: 1.3, durationS: 1800, label: 'ATK +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage'], weight: 5 },
    unlock: { type: 'floorClear', floor: 5 },
  },
  recipe_gummy: {
    id: 'recipe_gummy',
    name: '凝胶软糖',
    icon: '🍬',
    cost: { gold: 40, materials: { mat_gel: 6 } },
    cookTimeS: 1800,
    buff: { stat: 'spd', mult: 1.3, durationS: 1800, label: 'SPD +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['mage'], weight: 4 },
    unlock: { type: 'floorClear', floor: 6 },
  },
  recipe_mush_wine: {
    id: 'recipe_mush_wine',
    name: '蘑菇果酒',
    icon: '🍷',
    cost: { gold: 25, materials: { mat_gel: 2, mat_rock_salt: 2 } },
    cookTimeS: 1800,
    buff: { stat: 'expGain', mult: 1.3, durationS: 1800, label: '经验获取 +30%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['bard'], weight: 5 },
    unlock: { type: 'floorClear', floor: 7 },
  },
  recipe_beast_roast: {
    id: 'recipe_beast_roast',
    name: '巨兽烤肉',
    icon: '🥩',
    cost: { gold: 30, materials: { mat_carapace: 2, mat_rock_salt: 2 } },
    cookTimeS: 2700,
    buff: { stat: 'atk', mult: 1.5, durationS: 2700, label: 'ATK +50%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['warrior', 'ranger'], weight: 6 },
    unlock: { type: 'floorClear', floor: 8 },
  },
  recipe_elixir: {
    id: 'recipe_elixir',
    name: '精灵秘酿',
    icon: '🍯',
    cost: { gold: 80, materials: { mat_mithril: 1, mat_core: 1 } },
    cookTimeS: 3600,
    buff: { stat: 'def', mult: 1.4, durationS: 3600, label: 'DEF +40%' },
    mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
    attraction: { classIds: ['bard', 'mage'], weight: 6 },
    unlock: { type: 'floorClear', floor: 9 },
  },
};

/** 初始已解锁的菜谱 */
export function initialUnlockedRecipes(): RecipeId[] {
  return Object.values(RECIPES)
    .filter((r) => r.unlock.type === 'initial')
    .map((r) => r.id);
}
