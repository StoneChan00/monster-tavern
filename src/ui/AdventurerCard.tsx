import { Panel } from './Panel';
import { Bar } from './Bar';
import { useGameStore } from '../store/gameStore';
import { CLASSES } from '../data/classes';
import { adventurerLevelCap, expToNext, getEffectiveStats } from '../engine/stats';

/** 冒险者卡：等级/HP/EXP/属性/忠诚度/菜肴 buff */
export function AdventurerCard() {
  // 本面板展示大量每秒变化的数值（HP/EXP/倒计时），整体订阅、每秒重渲染一次
  const s = useGameStore((st) => st.state);
  const cls = CLASSES[s.adventurer.classId];
  const stats = getEffectiveStats(s);
  const need = expToNext(s.adventurer.level);
  const cap = adventurerLevelCap(s.tavern.trainingGround);
  const atCap = s.adventurer.level >= cap;
  const hp = Math.min(s.adventurer.hp, stats.hp);

  return (
    <Panel title={`${s.adventurer.name} · ${cls.name}`} icon={cls.icon}>
      <div className="space-y-2 text-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-[#a89880]">{cls.role}</span>
          <span className="font-bold text-[#f0d78c]">
            Lv.{s.adventurer.level}
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
            <span className="tabular-nums">{atCap ? '—' : `${s.adventurer.exp} / ${need}`}</span>
          </div>
          <Bar value={atCap ? 1 : s.adventurer.exp} max={atCap ? 1 : need} color="#7e57c2" />
        </div>

        <div className="grid grid-cols-3 gap-1 pt-1">
          <Stat label="ATK" value={stats.atk} />
          <Stat label="DEF" value={stats.def} />
          <Stat label="SPD" value={stats.spd} />
        </div>

        <div>
          <div className="mb-0.5 flex justify-between">
            <span className="text-[#a89880]">💚 忠诚度</span>
            <span className="tabular-nums">{s.adventurer.loyalty} / 100</span>
          </div>
          <Bar value={s.adventurer.loyalty} max={100} color="#e5533d" height="h-3" />
        </div>

        {s.kitchen.buffs.length > 0 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {s.kitchen.buffs.map((b) => (
              <span
                key={b.recipeId}
                className="border-2 border-[#5c4325] bg-[#3a2d1e] px-1.5 py-0.5 text-[10px] text-[#f0d78c]"
              >
                🍲 {b.label} · {fmtClock(b.remainingS)}
              </span>
            ))}
          </div>
        ) : null}
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

/** 秒 → mm:ss */
function fmtClock(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
