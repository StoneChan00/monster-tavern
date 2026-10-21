/**
 * 云同步决策：纯函数，不碰 Firebase / DOM。
 * 本地和云端存档都带 rev（当前版本）与 baseRev（上一个版本）。
 * 一端的 baseRev 等于另一端的 rev 时，说明它是后写入的一方，可直接覆盖。
 */
import { SAVE_MAGIC } from '../save/migrate';

/** RTDB 中 saves/{uid} 的节点结构 */
export interface CloudRecord {
  /** 存档原文（migrate.serialize() 的产物，自带 magic / version / exportedAt） */
  json: string;
  /** 当前版本号 */
  rev: number;
  /** 上一个云档版本号 */
  baseRev: number;
  /** 写入时存档内部 exportedAt 的快照，展示与比较用 */
  savedAt: number;
  /** 写入方设备标识，冲突排查用 */
  deviceId: string;
  /** 服务端写入时刻（客户端时钟，仅用于比较先后） */
  updatedAt: number;
}

export interface SyncState {
  /** 本地存档 rev（无本地档时为 null） */
  localRev: number | null;
  /** 本地存档基于的云档 rev */
  localBaseRev: number | null;
  /** 当前云档 rev（null = 云端没有档） */
  remoteRev: number | null;
  /** 当前云档基于的 rev */
  remoteBaseRev: number | null;
}

export type SyncAction =
  /** 云端没档 → 把本地档提上去 */
  | 'upload'
  /** 本地没档，或远端比本机新 → 拉云端 */
  | 'download'
  /** 两边一致 → 无需动作 */
  | 'in-sync'
  /** 两边都动过且无法判断先后 → 交给用户选 */
  | 'conflict';

/** 依据 rev / baseRev 决定登录时的同步动作 */
export function decideSyncAction(s: SyncState): SyncAction {
  if (s.remoteRev === null) return 'upload';
  if (s.localRev === null) return 'download';
  if (s.localRev === s.remoteRev && s.localBaseRev === s.remoteRev) return 'in-sync';
  if (s.localBaseRev === s.remoteRev) return 'upload';
  if (s.remoteBaseRev === s.localRev) return 'download';
  return 'conflict';
}

/**
 * 从存档原文里取 exportedAt；magic 不匹配或解析失败返回 null。
 * 云端存档是玩家可写的，这里必须当成不可信输入。
 */
export function extractSavedAt(raw: string | null): number | null {
  if (!raw) return null;
  try {
    const env = JSON.parse(raw) as { magic?: unknown; exportedAt?: unknown };
    if (env.magic !== SAVE_MAGIC) return null;
    return typeof env.exportedAt === 'number' && Number.isFinite(env.exportedAt) ? env.exportedAt : null;
  } catch {
    return null;
  }
}

/**
 * 这是一个「几乎没玩过」的新档吗？
 * 用于「新设备登录」：本地只有初始档时直接载入云端档，不必打扰玩家。
 * 稍有进度的本地档一律走冲突流程，避免冲掉玩家刚打的进度。
 */
export function looksLikeFreshSave(state: {
  roster: readonly unknown[];
  meta?: { totalWavesCleared?: number };
}): boolean {
  const waves = state.meta?.totalWavesCleared ?? 0;
  return waves === 0 && state.roster.length <= 1;
}
