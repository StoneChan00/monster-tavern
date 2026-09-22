import { Panel } from './Panel';
import { AdventurerCard, RARITY_COLOR } from './AdventurerCard';
import { RecruitPanel } from './RecruitPanel';
import { Bar } from './Bar';
import { CharacterSprite } from './CharacterSprite';
import { useGameStore } from '../store/gameStore';
import { BALANCE } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { isSlotUnlocked } from '../engine/party';
import { getAdventurerStats, RARITY_LABEL } from '../engine/stats';
import type { GameState } from '../engine/types';

const ROWS: Array<{ label: string; icon: string; slots: number[] }> = [
  { label: '前排', icon: '🛡️', slots: [0, 3] },
  { label: '中排', icon: '⚔️', slots: [1, 4] },
  { label: '后排', icon: '🏹', slots: [2] },
];

/** 冒险者页签：编队（前中后排）/ 替补席 / 招募 */
export function PartyPanel() {
  const s = useGameStore((st) => st.state);
  const bench = s.roster.filter((a) => !s.party.includes(a.id));

  return (
    <div className="space-y-3">
      <Panel title="编队（前排承伤，中后排输出）" icon="🧑‍🤝‍🧑">
        <div className="space-y-2">
          {ROWS.map((row) => (
            <div key={row.label}>
              <div className="mb-1 text-[10px] font-bold text-[#a89880]">
                {row.icon} {row.label}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {row.slots.map((slot) => (
                  <SlotCard key={slot} slot={slot} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <RecruitPanel />

      <Panel title={`替补席（${bench.length}/${s.roster.length}）`} icon="🪑">
        {bench.length === 0 ? (
          <p className="text-xs text-[#a89880]">
            替补席空空如也。签约到访的冒险者、或把编队成员换下场休息。
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {bench.map((a) => (
              <AdventurerCard key={a.id} adv={a} />
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SlotCard({ slot }: { slot: number }) {
  const s = useGameStore((st) => st.state);
  return (
    <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2">
      <SlotContent slot={slot} state={s} />
    </div>
  );
}

function SlotContent({ slot, state }: { slot: number; state: GameState }) {
  const s = state;
  const unlocked = isSlotUnlocked(slot, s.player.reputation);
  const id = s.party[slot];
  const adv = id ? s.roster.find((a) => a.id === id) : undefined;

  if (!unlocked) {
    return (
      <div className="flex h-full items-center justify-center py-2 text-xs text-[#5b4d3a]">
        🔒 声望 {BALANCE.SLOT_UNLOCK_REP[slot]} 解锁
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {adv ? (
        <div>
          <div className="flex items-center gap-1.5 text-xs">
            <CharacterSprite classId={adv.classId} size={18} />
            <span className="truncate font-bold" style={{ color: RARITY_COLOR[adv.rarity] }}>
              {adv.name}
            </span>
            <span className="ml-auto shrink-0 text-[10px] text-[#a89880]">
              {RACES[adv.race]?.name ?? '人类'} · {CLASSES[adv.classId].name} ·{' '}
              <span style={{ color: RARITY_COLOR[adv.rarity] }}>{RARITY_LABEL[adv.rarity]}</span> ·
              Lv{adv.level}
            </span>
          </div>
          <Bar
            value={Math.min(adv.hp, getAdventurerStats(s, adv).hp)}
            max={getAdventurerStats(s, adv).hp}
            color={adv.hp <= 0 ? '#555' : '#7cb342'}
            height="h-2"
          />
        </div>
      ) : (
        <div className="py-1 text-center text-xs text-[#5b4d3a]">（空位）</div>
      )}
      <select
        className="pixel-select w-full"
        value={id ?? ''}
        onChange={(e) => {
          void useGameStore.getState().assignToSlot(slot, e.target.value || null);
        }}
      >
        <option value="">（空位）</option>
        {s.roster.map((a) => (
          <option key={a.id} value={a.id}>
            {CLASSES[a.classId].icon} {a.name} · {RACES[a.race]?.name ?? '人类'}
            {CLASSES[a.classId].name} · Lv{a.level}
          </option>
        ))}
      </select>
    </div>
  );
}
