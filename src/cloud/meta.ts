/**
 * 云同步的本地元数据（每个 uid 一份）：记录「上次同步时的基线」，
 * 用来判断本机档和云档各自有没有被改过。只存 localStorage，不参与存档内容。
 */
export const META_KEY = 'monster-tavern:cloud-meta';
export const DEVICE_KEY = 'monster-tavern:device-id';

export interface CloudMeta {
  uid: string;
  /** 上次同步成功时云档的 rev */
  baseRev: number;
  /** 上次同步成功时本地档的 exportedAt */
  lastSyncedLocalSavedAt: number | null;
  /** 上次同步成功时刻（本地时间，仅展示） */
  lastSyncedAt: number;
  deviceId: string;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 隐私模式 / 配额满：云同步降级为不可用，不影响单机 */
  }
}

/** 设备标识：随机生成一次并持久化，用于冲突排查与「同设备覆盖」判断 */
export function getDeviceId(): string {
  const existing = readStorage(DEVICE_KEY);
  if (existing) return existing;
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  writeStorage(DEVICE_KEY, id);
  return id;
}

/** 读该用户的同步基线；没有或属于别的 uid 时返回全新的基线 */
export function loadMeta(uid: string): CloudMeta {
  const raw = readStorage(META_KEY);
  const fallback: CloudMeta = {
    uid,
    baseRev: 0,
    lastSyncedLocalSavedAt: null,
    lastSyncedAt: 0,
    deviceId: getDeviceId(),
  };
  if (!raw) return fallback;
  try {
    const meta = JSON.parse(raw) as Partial<CloudMeta>;
    if (meta.uid !== uid) return fallback; // 换了账号：基线清零，走首次同步流程
    return {
      uid,
      baseRev: typeof meta.baseRev === 'number' ? meta.baseRev : 0,
      lastSyncedLocalSavedAt:
        typeof meta.lastSyncedLocalSavedAt === 'number' ? meta.lastSyncedLocalSavedAt : null,
      lastSyncedAt: typeof meta.lastSyncedAt === 'number' ? meta.lastSyncedAt : 0,
      deviceId: typeof meta.deviceId === 'string' ? meta.deviceId : getDeviceId(),
    };
  } catch {
    return fallback;
  }
}

export function saveMeta(meta: CloudMeta): void {
  writeStorage(META_KEY, JSON.stringify(meta));
}
