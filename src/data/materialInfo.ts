import { ELITE_CORE_OF, SIGIL_OF, levelUpCost } from './balance';
import { CLASSES } from './classes';
import { ELITE_SIGIL, MAP_DEFS, MONSTERS } from './monsters';
import { RECIPES } from './recipes';
import type { ClassId, MaterialId } from '../engine/types';

/**
 * 材料元数据派生（背包展示用）：
 * 用途（食材/升级）、来源（普通怪/精英）、精英标记全部从数据反查，不落库存档。
 */

const ALL_CLASSES = Object.keys(CLASSES) as ClassId[];

/** 精英掉落材料（职业徽记 + 精英魔核）——背包中绿色标记 */
const ELITE_DROP_IDS = new Set<MaterialId>([
  ...Object.values(SIGIL_OF),
  ...Object.values(ELITE_CORE_OF),
] as MaterialId[]);

export function isEliteDrop(materialId: MaterialId): boolean {
  return ELITE_DROP_IDS.has(materialId);
}

/** 食材：出现在任意菜谱原料中 */
export function isFoodMaterial(materialId: MaterialId): boolean {
  return Object.values(RECIPES).some((r) => (r.cost.materials[materialId] ?? 0) > 0);
}

export interface UpgradeUsage {
  /** null = 全职业通用 */
  classId: ClassId | null;
  className: string;
  /** 可用于升到的目标等级 */
  targets: number[];
}

/** 升级用途：扫描 levelUpCost(2..8, 全职业) 反查该材料出现的档位 */
export function upgradeUsagesOf(materialId: MaterialId): UpgradeUsage[] {
  const byClass = new Map<ClassId | null, Set<number>>();
  for (const cls of ALL_CLASSES) {
    for (let target = 2; target <= 8; target++) {
      const cost = levelUpCost(target, cls);
      if (cost && (cost.materials[materialId] ?? 0) > 0) {
        if (!byClass.has(cls)) byClass.set(cls, new Set());
        byClass.get(cls)!.add(target);
      }
    }
  }
  if (byClass.size === 0) return [];
  // 全职业通用档位 → 归并为 null
  const commonTargets = new Set<number>();
  for (let target = 2; target <= 8; target++) {
    if (ALL_CLASSES.every((cls) => byClass.get(cls)?.has(target))) commonTargets.add(target);
  }
  const usages: UpgradeUsage[] = [];
  if (commonTargets.size > 0) {
    usages.push({ classId: null, className: '全职业', targets: [...commonTargets] });
  }
  for (const cls of ALL_CLASSES) {
    const own = [...(byClass.get(cls) ?? [])].filter((t) => !commonTargets.has(t));
    if (own.length > 0) {
      usages.push({ classId: cls, className: CLASSES[cls].name, targets: own.sort((a, b) => a - b) });
    }
  }
  return usages;
}

/** "Lv.4" 或 "Lv.4-8" 格式化 */
function fmtTargets(targets: number[]): string {
  const sorted = [...targets].sort((a, b) => a - b);
  if (sorted.length <= 1) return `Lv.${sorted[0]}`;
  return `Lv.${sorted[0]}-${sorted[sorted.length - 1]}`;
}

/** 升级用途一行文案："全职业→Lv.3；战士→Lv.4-8" */
export function upgradeUsageText(materialId: MaterialId): string {
  return upgradeUsagesOf(materialId)
    .map((u) => `${u.className}→${fmtTargets(u.targets)}`)
    .join('；');
}

export interface MaterialSource {
  map: number;
  mapName: string;
  /** 掉落者（怪名；精英带「精英·」前缀） */
  from: string;
  elite: boolean;
}

/** 获取来源：普通怪掉落表 + 精英固定掉落（徽记/魔核）反查 */
export function materialSourcesOf(materialId: MaterialId): MaterialSource[] {
  const out: MaterialSource[] = [];
  for (const map of MAP_DEFS) {
    for (const mid of map.monsterPool) {
      const m = MONSTERS[mid];
      if (m && m.drops.some((d) => d.materialId === materialId)) {
        out.push({ map: map.number, mapName: map.name, from: m.name, elite: false });
      }
    }
    for (const eid of map.elitePool) {
      // 精英固定掉落：本图魔核 + 对应职业徽记
      const isCore = ELITE_CORE_OF[map.number] === materialId;
      const sigil = ELITE_SIGIL[eid];
      const isSigil = sigil !== undefined && SIGIL_OF[sigil] === materialId;
      if (isCore || isSigil) {
        out.push({ map: map.number, mapName: map.name, from: `精英·${MONSTERS[eid].name}`, elite: true });
      }
    }
  }
  return out;
}

/** 来源一行文案："图1·苔藓洞窟 史莱姆/淤泥怪；全图 精英" */
export function materialSourceText(materialId: MaterialId): string {
  const sources = materialSourcesOf(materialId);
  if (sources.length === 0) return '';
  const byMap = new Map<number, string[]>();
  for (const s of sources) {
    if (!byMap.has(s.map)) byMap.set(s.map, []);
    byMap.get(s.map)!.push(s.from);
  }
  return [...byMap.entries()]
    .map(([map, froms]) => `图${map}·${MAP_DEFS[map - 1].name} ${froms.slice(0, 3).join('/')}${froms.length > 3 ? '等' : ''}`)
    .join('；');
}
