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

/** 版本迁移链：migrations[n] 把 v_n 档案升级到 v_{n+1}。新增版本时在此追加。 */
const migrations: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  1: migrateV1toV2,
};

export function serialize(state: GameState): string {
  return JSON.stringify({
    magic: SAVE_MAGIC,
    version: SAVE_VERSION,
    state,
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
    return state;
  } catch {
    return null;
  }
}
