import { SAVE_VERSION } from '../engine/types';
import type { GameState } from '../engine/types';

export const SAVE_MAGIC = 'monster-tavern-save';

interface SaveEnvelope {
  magic: string;
  version: number;
  state: unknown;
  exportedAt: number;
}

/**
 * v1（Phase 0：单冒险者）→ v2（Phase 1：roster/party/招募/5设施/多层地牢）。
 * 保留玩家全部进度：汉克、材料、声望、训练场等级、已解锁菜谱。
 */
function migrateV1toV2(s: Record<string, unknown>): Record<string, unknown> {
  const oldMeta = (s.meta ?? {}) as Record<string, unknown>;
  const adv = (s.adventurer ?? {}) as Record<string, unknown>;
  const oldKitchen = (s.kitchen ?? {}) as Record<string, unknown>;
  const oldDungeon = (s.dungeon ?? {}) as Record<string, unknown>;
  const oldTavern = (s.tavern ?? {}) as Record<string, unknown>;
  const now = (oldMeta.lastSavedAt as number) ?? Date.now();

  const advId = (adv.id as string) ?? 'adv_hank';
  const unlocked = new Set<string>([...(oldKitchen.unlockedRecipes as string[] | undefined) ?? []]);
  unlocked.add('recipe_gel_soup');
  unlocked.add('recipe_bat_wings'); // v2 新增的初始菜谱补发

  return {
    ...s,
    version: 2,
    meta: {
      createdAt: (oldMeta.createdAt as number) ?? now,
      lastSavedAt: now,
      now,
      nextUid: (oldMeta.nextUid as number) ?? 1,
      lifetimeGoldEarned: (oldMeta.lifetimeGoldEarned as number) ?? 0,
      lifetimeExpEarned: (oldMeta.lifetimeExpEarned as number) ?? 0,
      totalWavesCleared: (oldMeta.totalWavesCleared as number) ?? 0,
      totalBossKills: (oldMeta.totalBossKills as number) ?? 0,
      floorsFirstCleared: oldMeta.bossFirstCleared ? ['floor_1'] : [],
    },
    roster: [adv],
    party: [advId, null, null, null, null],
    recruitment: {
      visitors: [],
      nextVisitAt: now + 180_000,
      lastWageDay: Math.floor(now / 86_400_000),
    },
    kitchen: {
      job: oldKitchen.job ?? null,
      unlockedRecipes: [...unlocked],
      buffs: (oldKitchen.buffs as unknown[]) ?? [],
    },
    tavern: {
      trainingGround: (oldTavern.trainingGround as number) ?? 0,
      lounge: 0,
      kitchen: 0,
      dorm: 0,
      intel: 0,
    },
    dungeon: {
      floorId: 'floor_1',
      waveIndex: (oldDungeon.waveIndex as number) ?? 0,
      status: (oldDungeon.status as string) ?? 'combat',
      restRemainingS: (oldDungeon.restRemainingS as number) ?? 0,
      monsters: (oldDungeon.monsters as unknown[]) ?? [],
      highestFloor: 1,
      farmFloor: 1,
    },
  };
}

/**
 * v2（Phase 1）→ v3（Phase 2 内容扩展）：
 * 冒险者与访客补 D&D 种族字段（默认人类）。
 */
function migrateV2toV3(s: Record<string, unknown>): Record<string, unknown> {
  const roster = ((s.roster ?? []) as Array<Record<string, unknown>>).map((a) => ({
    race: 'human',
    ...a,
  }));
  const rec = (s.recruitment ?? {}) as Record<string, unknown>;
  const visitors = ((rec.visitors ?? []) as Array<Record<string, unknown>>).map((v) => ({
    race: 'human',
    ...v,
  }));
  return { ...s, version: 3, roster, recruitment: { ...rec, visitors } };
}

/**
 * v3（Phase 2 前期）→ v4（图鉴/成就/统计）：
 * meta 补图鉴击杀表与出餐计数（历史进度无法回溯，从 0 开始积累）。
 */
function migrateV3toV4(s: Record<string, unknown>): Record<string, unknown> {
  const meta = (s.meta ?? {}) as Record<string, unknown>;
  return {
    ...s,
    version: 4,
    meta: {
      ...meta,
      monsterKills: (meta.monsterKills as Record<string, number>) ?? {},
      dishesCooked: (meta.dishesCooked as number) ?? 0,
    },
  };
}

/**
 * v4（20 层地牢 / 5 档稀有度）→ v5（6 张地图 / D&D 等级制）：
 * - 冒险者：rarity + level 折叠为新等级 1~10（稀有度给保底，旧等级按 3.5:1 压缩取 max），exp 清零
 * - 地牢：层数按区间映射为地图（1-4→图1，5-6→图2，7→图3，8-10→图4，11-15→图5，16-20→图6）
 * - floorsFirstCleared → mapsFirstCleared（首杀楼层所在地图）
 */
function migrateV4toV5(s: Record<string, unknown>): Record<string, unknown> {
  const rarityBase: Record<string, number> = { common: 1, fine: 2, rare: 3, epic: 4, legendary: 5 };
  const floorToMap = (n: number): number =>
    n <= 4 ? 1 : n <= 6 ? 2 : n === 7 ? 3 : n <= 10 ? 4 : n <= 15 ? 5 : 6;

  const foldLevel = (a: Record<string, unknown>): Record<string, unknown> => {
    const oldLevel = (a.level as number) ?? 1;
    const base = rarityBase[(a.rarity as string) ?? 'common'] ?? 1;
    const level = Math.min(10, Math.max(base, Math.ceil(oldLevel / 3.5)));
    const { rarity: _rarity, ...rest } = a;
    void _rarity;
    return { ...rest, level, exp: 0 };
  };

  const roster = ((s.roster ?? []) as Array<Record<string, unknown>>).map(foldLevel);
  const rec = (s.recruitment ?? {}) as Record<string, unknown>;
  const visitors = ((rec.visitors ?? []) as Array<Record<string, unknown>>).map(foldLevel);

  const meta = (s.meta ?? {}) as Record<string, unknown>;
  const oldFloors = (meta.floorsFirstCleared as string[]) ?? [];
  const mapsFirstCleared = [...new Set(
    oldFloors
      .map((id) => floorToMap(parseInt(id.split('_')[1] ?? '1', 10) || 1))
      .filter((n) => Number.isFinite(n)),
  )];
  const { floorsFirstCleared: _f, ...metaRest } = meta;
  void _f;

  const dungeonOld = (s.dungeon ?? {}) as Record<string, unknown>;
  const h = (dungeonOld.highestFloor as number) ?? 1;
  const unlockedFromProgress =
    h <= 1 ? 1 : h <= 5 ? 2 : h <= 7 ? 3 : h <= 11 ? 4 : h <= 16 ? 5 : 6;
  const unlockedMaps = Math.min(
    6,
    Math.max(unlockedFromProgress, ...mapsFirstCleared.map((n) => n + 1), 1),
  );
  const activeMap = Math.min(unlockedMaps, floorToMap((dungeonOld.farmFloor as number) ?? 1));

  return {
    ...s,
    version: 5,
    meta: { ...metaRest, mapsFirstCleared },
    roster,
    recruitment: { ...rec, visitors },
    dungeon: {
      mapId: `map_${activeMap}`,
      // 战斗中/波间 → 转入 1 秒波间，恢复后由 tick 重新生成首波；休整保留
      status: dungeonOld.status === 'resting' ? 'resting' : 'waveRest',
      restRemainingS: 1,
      monsters: [],
      unlockedMaps,
      activeMap,
      waveCount: 0,
    },
  };
}

/**
 * v5（6 地图制 + D&D 等级制）→ v6（首次团灭应急资助）：
 * meta 补 wipeSubsidyClaimed。旧档未记录团灭史，按「未领取」处理——
 * 下次团灭时获得一次性小额拨款（对老玩家只是杯水车薪的馈赠，无害）。
 */
function migrateV5toV6(s: Record<string, unknown>): Record<string, unknown> {
  const meta = (s.meta ?? {}) as Record<string, unknown>;
  return {
    ...s,
    version: 6,
    meta: {
      ...meta,
      wipeSubsidyClaimed: (meta.wipeSubsidyClaimed as boolean) ?? false,
    },
  };
}

/**
 * v6（首杀 BOSS 解锁制 + 烹饪 buff 制）→ v7（精英怪体系 + 厨房菜单制）：
 * - kitchen：job/buffs 移除（烹饪中任务的材料不退补），改为空菜单 + 下一供给周期
 * - mapsFirstCleared 语义变为"首次讨伐本图精英"（旧档已通关地图直接继承）
 * - totalBossKills 语义变为"累计精英击杀"（历史计数保留）
 * - 存量魔物实例补 elite 字段缺失（undefined 即普通）
 */
function migrateV6toV7(s: Record<string, unknown>): Record<string, unknown> {
  const kitchen = (s.kitchen ?? {}) as Record<string, unknown>;
  const now = (s.meta as Record<string, unknown> | undefined)?.now as number | undefined ?? Date.now();
  return {
    ...s,
    version: 7,
    kitchen: {
      menu: Array<null>(7).fill(null),
      menuFed: Array<boolean>(7).fill(false),
      nextMenuCycleAt: now + 3_600_000,
      unlockedRecipes: (kitchen.unlockedRecipes as string[]) ?? [],
    },
  };
}

/** 版本迁移链：migrations[n] 把 v_n 档案升级到 v_{n+1}。新增版本时在此追加。 */
const migrations: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1toV2,
  2: migrateV2toV3,
  3: migrateV3toV4,
  4: migrateV4toV5,
  5: migrateV5toV6,
  6: migrateV6toV7,
};

export function serialize(state: GameState): string {
  // events 是瞬态回放流，不进存档
  const { events: _events, ...persistable } = state;
  return JSON.stringify({
    magic: SAVE_MAGIC,
    version: SAVE_VERSION,
    state: persistable,
    exportedAt: Date.now(),
  } satisfies SaveEnvelope);
}

/** 解析 + 校验 + 迁移。任何失败返回 null（由调用方决定回退到新档）。 */
export function deserialize(raw: string): GameState | null {
  try {
    const env = JSON.parse(raw) as Partial<SaveEnvelope>;
    if (env.magic !== SAVE_MAGIC || typeof env.state !== 'object' || env.state === null) {
      return null;
    }
    let data = env.state as Record<string, unknown>;
    let v = typeof env.version === 'number' ? env.version : 0;
    while (v < SAVE_VERSION) {
      const m = migrations[v];
      if (!m) return null; // 缺失迁移步 → 放弃该档
      data = m(data);
      v += 1;
    }
    const state = data as unknown as GameState;
    state.version = SAVE_VERSION;
    state.events = []; // 瞬态字段：旧档/剥离档统一补空
    return state;
  } catch {
    return null;
  }
}
