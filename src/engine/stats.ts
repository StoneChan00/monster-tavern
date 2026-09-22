import { CLASSES } from '../data/classes';
import type { BaseStats, BuffStat, GameState, Rarity } from './types';

export const RARITY_MULT: Record<Rarity, number> = {
  common: 1,
  fine: 1.3,
  rare: 1.7,
  epic: 2.2,
  legendary: 3,
};

/** 升到 level+1 所需经验：20 × level^1.5 */
export function expToNext(level: number): number {
  return Math.round(20 * Math.pow(level, 1.5));
}

/** 训练场提供的冒险者等级上限 */
export function adventurerLevelCap(trainingGroundLevel: number): number {
  return 10 + trainingGroundLevel * 5;
}

/**
 * 结算后的最终属性 = 职业基础 + 等级成长，× 稀有度 × 训练场 × 菜肴 buff。
 * 同属性多道菜肴 buff 不叠加，取最强一道。
 */
export function getEffectiveStats(state: GameState): BaseStats {
  const cls = CLASSES[state.adventurer.classId];
  const lv = state.adventurer.level;
  const rarityMult = RARITY_MULT[state.adventurer.rarity];
  const trainMult = 1 + state.tavern.trainingGround * 0.08;
  const buffMult = (stat: BuffStat): number =>
    state.kitchen.buffs.filter((b) => b.stat === stat).reduce((m, b) => Math.max(m, b.mult), 1);

  const roll = (base: number, per: number, stat: BuffStat) =>
    // Math.round 而非 floor：低数值时保证加成可感知（12×1.08 → 13 而非 12）
    Math.max(1, Math.round((base + per * (lv - 1)) * rarityMult * trainMult * buffMult(stat)));

  return {
    hp: roll(cls.base.hp, cls.perLevel.hp, 'hp'),
    atk: roll(cls.base.atk, cls.perLevel.atk, 'atk'),
    def: roll(cls.base.def, cls.perLevel.def, 'def'),
    spd: roll(cls.base.spd, cls.perLevel.spd, 'spd'),
  };
}
