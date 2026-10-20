/**
 * RTDB 云存档读写：一个用户一个节点 saves/{uid}。
 *
 * 写入一律带「版本号守卫」：期望 rev 与远端不一致就放弃本次写入并返回 conflict，
 * 由 UI 交给玩家决定，绝不静默覆盖另一台设备刚写进去的进度。
 */
import { get, ref, runTransaction, set, type Database } from 'firebase/database';
import { MAX_CLOUD_BYTES } from './config';
import { extractSavedAt, type CloudRecord } from './decision';
import { getDeviceId } from './meta';

/** RTDB 路径：每个 uid 一份存档 */
export function cloudSavePath(uid: string): string {
  return `saves/${uid}`;
}

/** 读取云档；不存在或结构异常都按「没有档」处理 */
export async function readCloud(db: Database, uid: string): Promise<CloudRecord | null> {
  const snapshot = await get(ref(db, cloudSavePath(uid)));
  if (!snapshot.exists()) return null;

  const value = snapshot.val() as Partial<CloudRecord> | null;
  if (!value || typeof value.json !== 'string' || typeof value.rev !== 'number') return null;

  return {
    json: value.json,
    rev: value.rev,
    savedAt: typeof value.savedAt === 'number' ? value.savedAt : 0,
    deviceId: typeof value.deviceId === 'string' ? value.deviceId : '',
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
  };
}

export type PushResult =
  | { kind: 'ok'; rev: number }
  /** 远端已被别的设备改写：本次放弃，交给玩家决定 */
  | { kind: 'conflict' }
  | { kind: 'too-large' }
  /** 本地存档解析不出来（magic 不对 / 损坏），不上传 */
  | { kind: 'invalid-local' };

/**
 * 写入云档。
 * - `expectedRev` 为 null 表示「期望云端为空」（首次上传）
 * - `force` 为 true 时忽略远端版本，强制覆盖（玩家明确选了「用本地覆盖云端」）
 */
export async function pushCloud(
  db: Database,
  uid: string,
  raw: string,
  options: { expectedRev: number | null; force?: boolean },
): Promise<PushResult> {
  if (raw.length > MAX_CLOUD_BYTES) return { kind: 'too-large' };

  const savedAt = extractSavedAt(raw);
  if (savedAt === null) return { kind: 'invalid-local' };

  const buildRecord = (rev: number): CloudRecord => ({
    json: raw,
    rev,
    savedAt,
    deviceId: getDeviceId(),
    updatedAt: Date.now(),
  });

  // 强制覆盖：先读当前 rev 再写，保证 rev 依旧单调
  if (options.force) {
    const current = await readCloud(db, uid);
    const rev = (current?.rev ?? 0) + 1;
    await set(ref(db, cloudSavePath(uid)), buildRecord(rev));
    return { kind: 'ok', rev };
  }

  let guardFailed = false;
  const result = await runTransaction(ref(db, cloudSavePath(uid)), (currentData: unknown) => {
    const current = (currentData ?? null) as CloudRecord | null;
    const currentRev = current && typeof current.rev === 'number' ? current.rev : 0;
    const expected = options.expectedRev;
    const mismatch = expected === null ? currentRev !== 0 : currentRev !== expected;
    if (mismatch) {
      guardFailed = true;
      return undefined; // 中止事务：保留远端内容
    }
    return buildRecord(currentRev + 1);
  });

  if (guardFailed || !result.committed) return { kind: 'conflict' };

  const committed = result.snapshot.val() as CloudRecord | null;
  return { kind: 'ok', rev: committed?.rev ?? 0 };
}
