import { describe, expect, it } from 'vitest';
import { decideSyncAction, extractSavedAt, looksLikeFreshSave, type SyncState } from '../src/cloud/decision';
import { serialize } from '../src/save/migrate';
import { createInitialState } from '../src/engine/initialState';

/** 构造同步状态，默认「已同步且两边都没动」 */
function snapshot(over: Partial<SyncState> = {}): SyncState {
  return {
    localSavedAt: 1000,
    lastSyncedLocalSavedAt: 1000,
    baseRev: 3,
    remoteRev: 3,
    remoteUpdatedAt: 1000,
    ...over,
  };
}

describe('云同步决策', () => {
  it('云端没有档时上传本地档（首次登录）', () => {
    expect(decideSyncAction(snapshot({ remoteRev: null, remoteUpdatedAt: null }))).toBe('upload');
  });

  it('本地没有可解析的档时下载云端档', () => {
    expect(decideSyncAction(snapshot({ localSavedAt: null }))).toBe('download');
  });

  it('云端未被别的设备改过、本机继续玩过 → 上传', () => {
    expect(decideSyncAction(snapshot({ localSavedAt: 2000 }))).toBe('upload');
  });

  it('云端未被改、本机也没新进度 → 无需动作', () => {
    expect(decideSyncAction(snapshot())).toBe('in-sync');
  });

  it('云端被别的设备改过且更晚 → 下载云端', () => {
    expect(decideSyncAction(snapshot({ remoteRev: 4, remoteUpdatedAt: 3000, localSavedAt: 2000 }))).toBe(
      'download',
    );
  });

  it('云端被改过但本机更晚 → 冲突，交给玩家决定', () => {
    expect(decideSyncAction(snapshot({ remoteRev: 4, remoteUpdatedAt: 1500, localSavedAt: 2000 }))).toBe(
      'conflict',
    );
  });

  it('从未同步过的设备遇到云端档：远端更晚则下载', () => {
    expect(
      decideSyncAction(
        snapshot({
          baseRev: 0,
          remoteRev: 1,
          lastSyncedLocalSavedAt: null,
          localSavedAt: 1000,
          remoteUpdatedAt: 2000,
        }),
      ),
    ).toBe('download');
  });

  it('从未同步过但本机更晚：判为冲突而不是静默上传', () => {
    expect(
      decideSyncAction(
        snapshot({
          baseRev: 0,
          remoteRev: 1,
          lastSyncedLocalSavedAt: null,
          localSavedAt: 5000,
          remoteUpdatedAt: 2000,
        }),
      ),
    ).toBe('conflict');
  });
});

describe('存档时间戳解析', () => {
  it('真实存档能取出 exportedAt', () => {
    const raw = serialize(createInitialState());
    const savedAt = extractSavedAt(raw);
    expect(savedAt).toBeTypeOf('number');
    expect(Math.abs(Date.now() - (savedAt as number))).toBeLessThan(10_000);
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
