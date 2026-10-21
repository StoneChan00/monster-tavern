import { beforeEach, describe, expect, it, vi } from 'vitest';

/** 用内存 Map 模拟 RTDB 节点，验证「版本号守卫」是否符合预期 */
const nodes = vi.hoisted(() => new Map<string, unknown>());

vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path: string) => ({ path }),
  get: async (r: { path: string }) => ({
    exists: () => nodes.has(r.path),
    val: () => nodes.get(r.path) ?? null,
  }),
  set: async (r: { path: string }, value: unknown) => {
    nodes.set(r.path, value);
  },
  runTransaction: async (r: { path: string }, update: (current: unknown) => unknown) => {
    const current = nodes.get(r.path) ?? null;
    const next = update(current);
    if (next === undefined) return { committed: false, snapshot: { val: () => current } };
    nodes.set(r.path, next);
    return { committed: true, snapshot: { val: () => next } };
  },
}));

const { pushCloud, readCloud } = await import('../src/cloud/cloudSave');
const { serialize } = await import('../src/save/migrate');
const { createInitialState } = await import('../src/engine/initialState');

import type { Database } from 'firebase/database';

const db = {} as Database;
const UID = 'u1';
const raw = () => serialize(createInitialState());

describe('云存档读写', () => {
  beforeEach(() => nodes.clear());

  it('云端没有档时返回 null', async () => {
    expect(await readCloud(db, UID)).toBeNull();
  });

  it('首次上传（期望为空）写入 rev=1', async () => {
    const result = await pushCloud(db, UID, raw(), { expectedRev: null });
    expect(result).toEqual({ kind: 'ok', rev: 1 });
    const cloud = await readCloud(db, UID);
    expect(cloud?.rev).toBe(1);
    expect(cloud?.baseRev).toBe(0);
    expect(cloud?.savedAt).toBeGreaterThan(0);
  });

  it('守卫命中（rev 与期望一致）时写入 rev+1', async () => {
    await pushCloud(db, UID, raw(), { expectedRev: null });
    const result = await pushCloud(db, UID, raw(), { expectedRev: 1 });
    expect(result).toEqual({ kind: 'ok', rev: 2 });
    expect((await readCloud(db, UID))?.baseRev).toBe(1);
  });

  it('守卫不命中（别的设备已写过）时放弃写入并返回 conflict', async () => {
    await pushCloud(db, UID, raw(), { expectedRev: null });
    await pushCloud(db, UID, raw(), { expectedRev: 1 }); // 别的设备：rev → 2
    const before = await readCloud(db, UID);

    const result = await pushCloud(db, UID, raw(), { expectedRev: 1 }); // 本机还以为是 rev 1
    expect(result).toEqual({ kind: 'conflict' });

    const after = await readCloud(db, UID);
    expect(after?.rev).toBe(before?.rev); // 远端内容没有被覆盖
  });

  it('强制覆盖时忽略守卫，rev 仍然单调递增', async () => {
    await pushCloud(db, UID, raw(), { expectedRev: null });
    await pushCloud(db, UID, raw(), { expectedRev: 1 });
    const result = await pushCloud(db, UID, raw(), { expectedRev: 1, force: true });
    expect(result).toEqual({ kind: 'ok', rev: 3 });
    expect((await readCloud(db, UID))?.baseRev).toBe(2);
  });

  it('超长存档与损坏存档都不上传', async () => {
    expect(await pushCloud(db, UID, 'x'.repeat(600 * 1024), { expectedRev: null })).toEqual({
      kind: 'too-large',
    });
    expect(await pushCloud(db, UID, '{"magic":"wrong"}', { expectedRev: null })).toEqual({
      kind: 'invalid-local',
    });
    expect(nodes.size).toBe(0);
  });

  it('读出结构异常的节点按无档处理', async () => {
    nodes.set(`saves/${UID}`, { json: 123, rev: 'x' });
    expect(await readCloud(db, UID)).toBeNull();
  });

  it('旧云档缺少 baseRev 时按 -1 处理', async () => {
    nodes.set(`saves/${UID}`, { json: raw(), rev: 2, savedAt: Date.now() });
    expect((await readCloud(db, UID))?.baseRev).toBe(-1);
  });
});
