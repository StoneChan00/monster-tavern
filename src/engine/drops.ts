import type { MonsterDef } from '../data/monsters';

/**
 * 收益换算：离线时收益 × mult（0.6）。
 * 小数部分按概率进位，保证长期期望正确。
 */
export function scaledGain(base: number, mult: number, rng: () => number): number {
  const v = base * mult;
  const floor = Math.floor(v);
  return floor + (rng() < v - floor ? 1 : 0);
}

/** 击杀掉落：按权重随机取一条掉落配置 */
export function rollDrops(
  def: MonsterDef,
  mult: number,
  rng: () => number,
): Array<{ materialId: string; count: number }> {
  const total = def.drops.reduce((s, d) => s + d.weight, 0);
  let r = rng() * total;
  for (const d of def.drops) {
    r -= d.weight;
    if (r < 0) {
      const count = scaledGain(d.count, mult, rng);
      return count > 0 ? [{ materialId: d.materialId, count }] : [];
    }
  }
  return [];
}

/**
 * 带掉落率加成的掉落：dropMult > 1 时按 (dropMult - 1) 概率追加一次掉落，
 * 同类材料自动合并。
 */
export function rollDropsWithBonus(
  def: MonsterDef,
  gainMult: number,
  dropMult: number,
  rng: () => number,
): Array<{ materialId: string; count: number }> {
  let drops = rollDrops(def, gainMult, rng);
  if (dropMult > 1 && rng() < dropMult - 1) {
    const extra = rollDrops(def, gainMult, rng);
    const merged = new Map(drops.map((d) => [d.materialId, d.count]));
    for (const d of extra) {
      merged.set(d.materialId, (merged.get(d.materialId) ?? 0) + d.count);
    }
    drops = [...merged.entries()].map(([materialId, count]) => ({ materialId, count }));
  }
  return drops;
}
