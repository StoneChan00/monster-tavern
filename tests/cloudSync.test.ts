import { describe, expect, it } from 'vitest';
import { decideSyncAction, extractSavedAt, looksLikeFreshSave, type SyncState } from '../src/cloud/decision';
import { readSaveRevision, serialize } from '../src/save/migrate';
import { createInitialState } from '../src/engine/initialState';

/** 构造同步状态：本地和云端都在 rev=3，且本地基于云端 rev=3 */
function snapshot(over: Partial<SyncState> = {}): SyncState {
  return {
    localRev: 3,
    localBaseRev: 3,
    remoteRev: 3,
    remoteBaseRev: 2,
    ...over,
  };
}

describe('云同步决策', () => {
  it('云端没有档时上传本地档', () => {
    expect(decideSyncAction(snapshot({ remoteRev: null, remoteBaseRev: null }))).toBe('upload');
  });

  it('本地没有档时下载云端档', () => {
    expect(decideSyncAction(snapshot({ localRev: null, localBaseRev: null }))).toBe('download');
  });

  it('本地 rev 等于云端 rev 时无需同步', () => {
    expect(decideSyncAction(snapshot())).toBe('in-sync');
  });

  it('本地 baseRev 等于云端 rev 时本地为准，直接上传', () => {
    expect(decideSyncAction(snapshot({ localRev: 4, localBaseRev: 3, remoteRev: 3 }))).toBe('upload');
  });

  it('云端 baseRev 等于本地 rev 时云端为准，直接下载', () => {
    expect(decideSyncAction(snapshot({ localRev: 3, localBaseRev: 3, remoteRev: 4, remoteBaseRev: 3 }))).toBe(
      'download',
    );
  });

  it('两边各自前进时交给玩家选择', () => {
    expect(decideSyncAction(snapshot({ localRev: 4, localBaseRev: 3, remoteRev: 4, remoteBaseRev: 3 }))).toBe(
      'conflict',
    );
  });
});

describe('存档时间戳解析', () => {
  it('真实存档能取出 exportedAt', () => {
    const raw = serialize(createInitialState());
    const savedAt = extractSavedAt(raw);
    expect(savedAt).toBeTypeOf('number');
    expect(Math.abs(Date.now() - (savedAt as number))).toBeLessThan(10_000);
  });

  it('存档携带本地 rev / baseRev，旧存档按 0 处理', () => {
    expect(readSaveRevision(serialize(createInitialState(), { rev: 7, baseRev: 5 }))).toEqual({
      rev: 7,
      baseRev: 5,
    });
    expect(readSaveRevision(JSON.stringify({ magic: 'monster-tavern-save', state: {} }))).toEqual({
      rev: 0,
      baseRev: 0,
    });
  });

  it('损坏/伪造的存档一律视为无效', () => {
    expect(extractSavedAt(null)).toBeNull();
    expect(extractSavedAt('not json')).toBeNull();
    expect(extractSavedAt(JSON.stringify({ magic: 'wrong', exportedAt: 1 }))).toBeNull();
    expect(extractSavedAt(JSON.stringify({ magic: 'monster-tavern-save' }))).toBeNull();
  });
});

describe('新档判定', () => {
  it('初始档（单人、0 波）视为新档', () => {
    expect(looksLikeFreshSave({ roster: [{}], meta: { totalWavesCleared: 0 } })).toBe(true);
  });

  it('有同伴或清过波次就不再是新档', () => {
    expect(looksLikeFreshSave({ roster: [{}, {}], meta: { totalWavesCleared: 0 } })).toBe(false);
    expect(looksLikeFreshSave({ roster: [{}], meta: { totalWavesCleared: 3 } })).toBe(false);
  });
});
