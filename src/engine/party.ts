import { BALANCE } from '../data/balance';
import type { AdventurerState, GameState } from './types';

export interface PartyMember {
  adv: AdventurerState;
  slot: number;
}

/** 编队成员（按槽位顺序） */
export function getPartyMembers(state: GameState): PartyMember[] {
  const out: PartyMember[] = [];
  state.party.forEach((id, slot) => {
    if (!id) return;
    const adv = state.roster.find((a) => a.id === id);
    if (adv) out.push({ adv, slot });
  });
  return out;
}

/** 槽位是否解锁（声望门槛） */
export function isSlotUnlocked(slot: number, reputation: number): boolean {
  return (BALANCE.SLOT_UNLOCK_REP[slot] ?? 0) <= reputation;
}
