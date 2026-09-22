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
 * 版本迁移链：migrations[n] 把 v_n 档案升级到 v_{n+1}。
 * 未来改存档结构时在此追加迁移函数，旧档永不报废。
 */
const migrations: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  // 示例（v0 → v1，v0 从未发布，仅锁定模式）：
  // 0: (s) => ({ ...s, player: { gold: (s as { coins?: number }).coins ?? 0, reputation: 0 }, version: 1 }),
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
