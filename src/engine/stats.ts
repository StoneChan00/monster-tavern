import { BALANCE, MENU_CONFIG, menuConfig } from '../data/balance';
import { BARD_AURA, CLASSES } from '../data/classes';
import { activeBonds } from '../data/bonds';
import { RECIPES } from '../data/recipes';
import { RACES } from '../data/races';
import { getPartyMembers } from './party';
import { LEVEL_CAP } from './types';
import type { AdventurerState, BaseStats, BuffStat, ClassId, GameState } from './types';

/**
 * D&D 等级档位（等级 = 稀有度）：着色与称号按等级区间划分。
 * Lv9-10 传奇（金色）世界屈指可数。
 */
export interface LevelTier {
  label: string;
  color: string;
}

export function levelTier(level: number): LevelTier {
  if (level >= 9) return { label: '传奇', color: '#e8a33d' };
  if (level >= 7) return { label: '大师', color: '#a569d8' };
  if (level >= 5) return { label: '资深', color: '#5b9bd5' };
  if (level >= 3) return { label: '老练', color: '#7cb342' };
  return { label: '学徒', color: '#a89880' };
}

/** 升到 level+1 所需经验：20 × level^1.5（攒满后需花钱进行升级仪式） */
export function expToNext(level: number): number {
  return Math.round(20 * Math.pow(level, 1.5));
}

/** 冒险者等级上限（D&D 制固定 10 级；训练场只加属性不再抬上限） */
export function adventurerLevelCap(_trainingGroundLevel: number): number {
  void _trainingGroundLevel;
  return LEVEL_CAP;
}

/**
 * 菜单生效的菜品（v7 菜单制）：
 * 槽位已设菜且该槽最近一次小时供给足料（menuFed）。
 * 菜品效果**独立生效**，无结构门控；结构满足只提供额外加成（见 activeMenuStructures）。
 */
export function activeMenuRecipes(state: GameState): string[] {
  const cfg = menuConfig(state.tavern.kitchen);
  const dishes: string[] = [];
  for (let i = 0; i < state.kitchen.menu.length && i < cfg.slots; i++) {
    const id = state.kitchen.menu[i];
    if (!id || !state.kitchen.menuFed[i]) continue;
    if (RECIPES[id]) dishes.push(id);
  }
  return dishes;
}

/** 供料中菜品覆盖的类别集合 */
function fedMenuCategories(state: GameState): Set<string> {
  const cats = new Set<string>();
  for (const id of activeMenuRecipes(state)) {
    const r = RECIPES[id];
    if (r) cats.add(r.category);
  }
  return cats;
}

/**
 * 满足结构的等级列表（嵌套叠加）：
 * 供料菜单覆盖该级必需类别 → 该级结构加成生效。
 * 高级结构类别要求包含低级 → 满足高级自动满足低级，效果叠加。
 */
export function activeMenuStructures(state: GameState): number[] {
  const cats = fedMenuCategories(state);
  const result: number[] = [];
  for (let lv = 1; lv <= 4; lv++) {
    const cfg = MENU_CONFIG[lv];
    if (cfg.required.every((c) => cats.has(c))) result.push(lv);
  }
  return result;
}

/** 结构加成乘区（statMult / expMult / dropMult） */
function structureMult(state: GameState, key: 'statMult' | 'expMult' | 'dropMult'): number {
  return activeMenuStructures(state).reduce((m, lv) => {
    const v = MENU_CONFIG[lv].bonus[key];
    return v ? m * v : m;
  }, 1);
}

/** 每次供给周期的结构额外忠诚（1 级结构「温饱套餐」） */
export function menuLoyaltyBonus(state: GameState): number {
  return activeMenuStructures(state).reduce((sum, lv) => sum + (MENU_CONFIG[lv].bonus.loyaltyBonus ?? 0), 0);
}

/** 全局菜肴 buff：生效菜单中同属性多道取最强 */
function dishBuffMult(state: GameState, stat: BuffStat): number {
  return activeMenuRecipes(state)
    .map((id) => RECIPES[id])
    .reduce((m, r) => (r.buff.stat === stat ? Math.max(m, r.buff.mult) : m), 1);
}

/** 编队存活成员的职业列表（羁绊与光环只看存活者） */
export function alivePartyClasses(state: GameState): ClassId[] {
  return getPartyMembers(state)
    .filter((m) => m.adv.hp > 0)
    .map((m) => m.adv.classId);
}

/**
 * 结算后的最终属性 = (职业基础 + 种族修正 + 等级成长)
 * × 训练场 × 忠诚度 × 菜肴 buff × 羁绊（编队） × 诗人光环（编队）
 * D&D 制：等级本身即强度（perLevel 成长承担原稀有度乘区的分档作用）。
 * Math.round 而非 floor：低数值时保证加成可感知。
 */
export function getAdventurerStats(state: GameState, adv: AdventurerState): BaseStats {
  const cls = CLASSES[adv.classId];
  const race = RACES[adv.race] ?? RACES.human;
  const lv = adv.level;
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
          trainMult *
          loyaltyMult *
          dishBuffMult(state, stat) *
          structureMult(state, 'statMult') *
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

/** 队伍掉落率乘区（菜肴 dropRate buff × 羁绊掉率 × 结构加成） */
export function getPartyDropMult(state: GameState): number {
  let m = dishBuffMult(state, 'dropRate') * structureMult(state, 'dropMult');
  for (const b of activeBonds(alivePartyClasses(state))) {
    if (b.effect.stat === 'dropRate') m *= b.effect.mult;
  }
  return m;
}

/** 队伍经验乘区（菜肴 expGain buff × 结构加成） */
export function getPartyExpMult(state: GameState): number {
  return dishBuffMult(state, 'expGain') * structureMult(state, 'expMult');
}
