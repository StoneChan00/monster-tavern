import { Panel } from './Panel';
import { Bar } from './Bar';
import { CharacterSprite } from './CharacterSprite';
import { useGameStore } from '../store/gameStore';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { BALANCE } from '../data/balance';
import {
  adventurerLevelCap,
  expToNext,
  getAdventurerStats,
  RARITY_INDEX,
  RARITY_LABEL,
} from '../engine/stats';
import type { AdventurerState, Rarity } from '../engine/types';

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#a89880',
  fine: '#7cb342',
  rare: '#5b9bd5',
  epic: '#a569d8',
  legendary: '#e8a33d',
};

/** 冒险者详情卡（编队/替补通用） */
export function AdventurerCard({ adv }: { adv: AdventurerState }) {
  const s = useGameStore((st) => st.state);
  const cls = CLASSES[adv.classId];
  const stats = getAdventurerStats(s, adv);
  const need = expToNext(adv.level);
  const cap = adventurerLevelCap(s.tavern.trainingGround);
  const atCap = adv.level >= cap;
  const hp = Math.min(adv.hp, stats.hp);
  const inParty = s.party.includes(adv.id);
  const wage = BALANCE.WAGE_PER_RARITY[RARITY_INDEX[adv.rarity]];

  return (
    <Panel
      title={
        <span style={{ color: RARITY_COLOR[adv.rarity] }}>
          {adv.name} · {RARITY_LABEL[adv.rarity]}
        </span>
      }
      icon={<CharacterSprite classId={adv.classId} size={18} />}
    >
      <div className="space-y-2 text-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-[#a89880]">
            {RACES[adv.race]?.name ?? '人类'} · {cls.name} · {cls.role.split(' / ')[0]}
            {inParty ? ' · ⚑ 出征中' : ' · 替补'}
          </span>
          <span className="font-bold text-[#f0d78c]">
            Lv.{adv.level}
            <span className="text-[#a89880]"> / {cap}</span>
          </span>
        </div>

        <div>
          <div className="mb-0.5 flex justify-between">
            <span className="text-[#a89880]">❤️ HP</span>
            <span className="tabular-nums">
              {hp} / {stats.hp}
            </span>
          </div>
          <Bar value={hp} max={stats.hp} color="#7cb342" />
        </div>

        <div>
          <div className="mb-0.5 flex justify-between">
            <span className="text-[#a89880]">✨ EXP{atCap ? '（已达等级上限）' : ''}</span>
            <span className="tabular-nums">{atCap ? '—' : `${adv.exp} / ${need}`}</span>
          </div>
          <Bar value={atCap ? 1 : adv.exp} max={atCap ? 1 : need} color="#7e57c2" />
        </div>

        <div className="grid grid-cols-3 gap-1 pt-1">
          <Stat label="ATK" value={stats.atk} />
          <Stat label="DEF" value={stats.def} />
          <Stat label="SPD" value={stats.spd} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-0.5 flex justify-between">
              <span className="text-[#a89880]">💚 忠诚</span>
              <span className="tabular-nums">{adv.loyalty}</span>
            </div>
            <Bar value={adv.loyalty} max={100} color="#e5533d" height="h-2.5" />
          </div>
          <div className="flex items-end justify-end pb-0.5 text-[11px] text-[#a89880]">
            日薪 💰{wage}/天
          </div>
        </div>
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-1 text-center">
      <div className="text-[10px] text-[#a89880]">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
