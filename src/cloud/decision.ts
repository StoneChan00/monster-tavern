/**
 * 云同步决策：纯函数，不碰 Firebase / DOM，便于单测覆盖全部冲突分支。
 *
 * 判定用的是「版本号 + 时间戳」两个信号：
 *   - 云档 rev 是否还在我们上次同步时的基线（检测别的设备是否写过）
 *   - 本地档 exportedAt 是否晚于上次同步（检测本机是否继续玩过）
 * 两个信号互相矛盾（我们都玩过、对方也写过）就是冲突，绝不静默覆盖。
 */
import { SAVE_MAGIC } from '../save/migrate';

/** RTDB 中 saves/{uid} 的节点结构 */
export interface CloudRecord {
  /** 存档原文（migrate.serialize() 的产物，自带 magic / version / exportedAt） */
  json: string;
  /** 单调递增版本号：每次写入 +1，用于检测「别的设备是否改过」 */
  rev: number;
  /** 写入时存档内部 exportedAt 的快照，展示与比较用 */
  savedAt: number;
  /** 写入方设备标识，冲突排查用 */
  deviceId: string;
  /** 服务端写入时刻（客户端时钟，仅用于比较先后） */
  updatedAt: number;
}

export interface SyncState {
  /** 本地档 exportedAt（解析失败或没有档时为 null） */
  localSavedAt: number | null;
  /** 上次同步成功时本地档的 exportedAt（null = 从未同步过） */
  lastSyncedLocalSavedAt: number | null;
  /** 上次同步成功时云档的 rev（0 = 从未同步过） */
  baseRev: number;
  /** 当前云档 rev（null = 云端没有档） */
  remoteRev: number | null;
  /** 当前云档写入时刻（null = 云端没有档） */
  remoteUpdatedAt: number | null;
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

/** 依据版本号与时间戳决定登录时的同步动作 */
export function decideSyncAction(s: SyncState): SyncAction {
  // 云端空：首次把本地档提上去（新用户 / 老玩家第一次登录）
  if (s.remoteRev === null) return 'upload';
  // 本地没有可解析的档（例如刚清了浏览器数据）：直接拉云端
  if (s.localSavedAt === null) return 'download';

  // 云档还是我们上次同步的那一版：远端没被别的设备改过
  if (s.remoteRev === s.baseRev) {
    const localAdvanced = s.lastSyncedLocalSavedAt === null || s.localSavedAt > s.lastSyncedLocalSavedAt;
    return localAdvanced ? 'upload' : 'in-sync';
  }

  // 远端被别的设备写过：对方比本机更晚活动就直接拉，否则交给玩家决定
  return (s.remoteUpdatedAt ?? 0) > s.localSavedAt ? 'download' : 'conflict';
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
