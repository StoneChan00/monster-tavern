import { BALANCE } from '../data/balance';
import { tick } from './tick';
import type { GameState, OfflineReport, TickOptions } from './types';

interface Snapshot {
  gold: number;
  lifetimeExp: number;
  levelSum: number;
  inventory: Record<string, number>;
  wavesCleared: number;
  bossKills: number;
}

function snapshot(state: GameState): Snapshot {
  return {
    gold: state.player.gold,
    lifetimeExp: state.meta.lifetimeExpEarned,
    levelSum: state.roster.reduce((s, a) => s + a.level, 0),
    inventory: { ...state.inventory },
    wavesCleared: state.meta.totalWavesCleared,
    bossKills: state.meta.totalBossKills,
  };
}

export interface OfflineResult {
  report: OfflineReport | null;
  clockTampered: boolean;
}

/**
 * 离线结算：与在线完全相同的 tick 路径（含到访/日薪/菜谱解锁），
 * 收益按 OFFLINE_EFFICIENCY 折算。
 * awaySeconds < 0（时钟回拨）→ 不结算并标记 clockTampered。
 */
export function applyOffline(state: GameState, awaySeconds: number, opts: TickOptions = {}): OfflineResult {
  if (awaySeconds < 0) return { report: null, clockTampered: true };
  if (awaySeconds === 0) return { report: null, clockTampered: false };

  const applied = Math.min(Math.floor(awaySeconds), BALANCE.OFFLINE_CAP_S);
  const before = snapshot(state);
  tick(state, applied, { ...opts, offline: true });

  const materials: Record<string, number> = {};
  for (const k of Object.keys(state.inventory)) {
    const gained = state.inventory[k] - (before.inventory[k] ?? 0);
    if (gained > 0) materials[k] = gained;
  }

  const report: OfflineReport = {
    awaySeconds: Math.floor(awaySeconds),
    appliedSeconds: applied,
    efficiency: BALANCE.OFFLINE_EFFICIENCY,
    gold: state.player.gold - before.gold,
    exp: state.meta.lifetimeExpEarned - before.lifetimeExp,
    levelsGained: state.roster.reduce((s, a) => s + a.level, 0) - before.levelSum,
    materials,
    wavesCleared: state.meta.totalWavesCleared - before.wavesCleared,
    bossKills: state.meta.totalBossKills - before.bossKills,
  };
  return { report, clockTampered: false };
}
