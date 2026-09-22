import { BALANCE } from '../data/balance';
import { BARD_AURA, CLASSES } from '../data/classes';
import { activeBonds } from '../data/bonds';
import { RACES } from '../data/races';
import { getPartyMembers } from './party';
import type { AdventurerState, BaseStats, BuffStat, ClassId, GameState, Rarity } from './types';

export const RARITY_MULT: Record<Rarity, number> = {
  common: 1,
  fine: 1.3,
  rare: 1.7,
  epic: 2.2,
  legendary: 3,
};

export const RARITY_INDEX: Record<Rarity, number> = {
  common: 0,
  fine: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '普通',
  fine: '优秀',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

/** 升到 level+1 所需经验：20 × level^1.5 */
export function expToNext(level: number): number {
  return Math.round(20 * Math.pow(level, 1.5));
}

/** 训练场提供的冒险者等级上限 */
export function adventurerLevelCap(trainingGroundLevel: number): number {
  return 10 + trainingGroundLevel * 5;
}

/** 全局菜肴 buff：同属性多道取最强 */
function dishBuffMult(state: GameState, stat: BuffStat): number {
  return state.kitchen.buffs.filter((b) => b.stat === stat).reduce((m, b) => Math.max(m, b.mult), 1);
}

/** 编队存活成员的职业列表（羁绊与光环只看存活者） */
export function alivePartyClasses(state: GameState): ClassId[] {
  return getPartyMembers(state)
    .filter((m) => m.adv.hp > 0)
    .map((m) => m.adv.classId);
}

/**
 * 结算后的最终属性 = 职业基础 + 种族修正 + 等级成长
 * × 稀有度 × 训练场 × 忠诚度 × 菜肴 buff × 羁绊（编队） × 诗人光环（编队）
 * Math.round 而非 floor：低数值时保证加成可感知。
 */
export function getAdventurerStats(state: GameState, adv: AdventurerState): BaseStats {
  const cls = CLASSES[adv.classId];
  const race = RACES[adv.race] ?? RACES.human;
  const lv = adv.level;
  const rarityMult = RARITY_MULT[adv.rarity];
  const trainMult = 1 + state.tavern.trainingGround * 0.08;
  const loyaltyMult = 1 + (adv.loyalty / 100) * BALANCE.LOYALTY_STAT_BONUS;

  // 羁绊与光环仅对编队成员生效
  let bondAtk = 1;
  let bondDef = 1;
  if (state.party.includes(adv.id)) {
    const alive = alivePartyClasses(state);
    for (const b of activeBonds(alive)) {
      if (b.effect.stat === 'atk') bondAtk *= b.effect.mult;
      if (b.effect.stat === 'def') bondDef *= b.effect.mult;
    }
    if (alive.includes('bard')) bondAtk *= BARD_AURA.mult;
  }

  const roll = (
    base: number,
    per: number,
    raceMod: number,
    stat: BuffStat,
    partyMult: number,
  ) =>
    Math.max(
      1,
      Math.round(
        (base + raceMod + per * (lv - 1)) *
          rarityMult *
          trainMult *
          loyaltyMult *
          dishBuffMult(state, stat) *
          partyMult,
      ),
    );

  return {
    hp: roll(cls.base.hp, cls.perLevel.hp, race.statMods.hp ?? 0, 'hp', 1),
    atk: roll(cls.base.atk, cls.perLevel.atk, race.statMods.atk ?? 0, 'atk', bondAtk),
    def: roll(cls.base.def, cls.perLevel.def, race.statMods.def ?? 0, 'def', bondDef),
    spd: roll(cls.base.spd, cls.perLevel.spd, race.statMods.spd ?? 0, 'spd', 1),
  };
}

/** 队伍掉落率乘区（菜肴 dropRate buff × 羁绊掉率） */
export function getPartyDropMult(state: GameState): number {
  let m = dishBuffMult(state, 'dropRate');
  for (const b of activeBonds(alivePartyClasses(state))) {
    if (b.effect.stat === 'dropRate') m *= b.effect.mult;
  }
  return m;
}

/** 队伍经验乘区（菜肴 expGain buff） */
export function getPartyExpMult(state: GameState): number {
  return dishBuffMult(state, 'expGain');
}
