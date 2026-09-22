import { BALANCE } from './balance';
import type { BuffStat, MaterialId, RecipeId } from '../engine/types';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  icon: string;
  cost: {
    gold: number;
    materials: Partial<Record<MaterialId, number>>;
  };
  /** 烹饪时长（秒）。Phase 0 压缩为 90s 便于验证；正式版 15min~8h */
  cookTimeS: number;
  buff: {
    stat: BuffStat;
    mult: number;
    durationS: number;
    label: string;
  };
  /** 出餐时冒险者获得的忠诚度 */
  mealLoyalty: number;
  /** Phase 1 招募系统预留：解锁后提升对应职业到访权重 */
  attraction?: { classId: string; weight: number };
}

export const GEL_SOUP: RecipeDef = {
  id: 'recipe_gel_soup',
  name: '魔物凝胶浓汤',
  icon: '🍲',
  cost: { gold: 10, materials: { mat_gel: 3 } },
  cookTimeS: 90,
  buff: { stat: 'atk', mult: 1.25, durationS: 600, label: 'ATK +25%' },
  mealLoyalty: BALANCE.LOYALTY_PER_MEAL,
};

export const RECIPES: Record<RecipeId, RecipeDef> = {
  [GEL_SOUP.id]: GEL_SOUP,
};
