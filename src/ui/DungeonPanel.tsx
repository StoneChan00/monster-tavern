import { Panel } from './Panel';
import { Bar } from './Bar';
import { useGameStore } from '../store/gameStore';
import { FLOORS, MONSTERS } from '../data/monsters';
import { fmtDuration, fmtNum } from '../utils/format';
import type { LogKind } from '../engine/types';

const LOG_COLORS: Record<LogKind, string> = {
  combat: 'text-slate-300',
  loot: 'text-amber-300',
  level: 'text-green-300',
  kitchen: 'text-orange-300',
  tavern: 'text-sky-300',
  system: 'text-purple-300',
};

/** 地牢面板：波次进度 / 魔物 / 战斗日志 */
export function DungeonPanel() {
  const s = useGameStore((st) => st.state);
  const floor = FLOORS[s.dungeon.floorId];
  const logs = [...s.log].reverse().slice(0, 14);
  const d = s.dungeon;

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-baseline gap-x-2">
          {floor.name}
          <span className="text-[10px] font-normal text-[#a89880]">
            累计清波 {fmtNum(d.status ? s.meta.totalWavesCleared : 0)} · BOSS 击杀 {s.meta.totalBossKills}
          </span>
        </span>
      }
      icon={floor.icon}
      className="flex h-full flex-col"
    >
      <div className="flex flex-col gap-3 text-xs lg:h-full">
        {/* 波次进度 + 状态 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {floor.waves.map((w, i) => {
              const current = i === d.waveIndex && d.status !== 'resting';
              return (
                <span
                  key={i}
                  className={`border-2 px-1.5 py-0.5 text-[10px] font-bold ${
                    current
                      ? 'border-[#d9a441] bg-[#3a2d1e] text-[#f0d78c]'
                      : 'border-[#3a2d1e] bg-[#1f1812] text-[#a89880]'
                  }`}
                >
                  {w.isBoss ? '👑 BOSS' : `第${i + 1}波`}
                </span>
              );
            })}
          </div>
          <StatusBadge />
        </div>

        {/* 魔物 */}
        <div className="space-y-1.5">
          {d.monsters.length === 0 ? (
            <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-3 text-center text-[#a89880]">
              队伍在酒馆休整中……
            </div>
          ) : (
            d.monsters.map((m) => {
              const def = MONSTERS[m.monsterId];
              const dead = m.hp <= 0;
              return (
                <div
                  key={m.uid}
                  className={`flex items-center gap-2 border-2 border-[#3a2d1e] bg-[#1f1812] p-1.5 ${
                    dead ? 'opacity-40 grayscale' : ''
                  }`}
                >
                  <span className="text-lg leading-none">{def.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between">
                      <span>{def.name}</span>
                      <span className="tabular-nums text-[#a89880]">
                        {Math.max(0, m.hp)}/{m.maxHp}
                      </span>
                    </div>
                    <Bar value={Math.max(0, m.hp)} max={m.maxHp} color="#c0392b" height="h-2.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 战斗日志 */}
        <div className="flex min-h-0 flex-1 flex-col border-2 border-[#3a2d1e] bg-[#141009] p-2">
          <div className="mb-1 text-[10px] font-bold text-[#a89880]">⚔️ 战斗记录</div>
          <ul className="h-44 space-y-0.5 overflow-y-auto text-[11px] leading-relaxed lg:h-full lg:min-h-44">
            {logs.map((e) => (
              <li key={e.id} className={LOG_COLORS[e.kind]}>
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function StatusBadge() {
  const d = useGameStore((st) => st.state.dungeon);
  if (d.status === 'combat') {
    return (
      <span className="combat-pulse border-2 border-[#5c1f16] bg-[#7a2d22] px-2 py-0.5 text-[10px] font-bold text-[#f0d5cf]">
        ⚔️ 战斗中
      </span>
    );
  }
  if (d.status === 'resting') {
    return (
      <span className="border-2 border-[#8a6a2a] bg-[#3a2d1e] px-2 py-0.5 text-[10px] font-bold text-[#f0d78c]">
        🛏️ 休整中 {fmtDuration(d.restRemainingS)}
      </span>
    );
  }
  return (
    <span className="border-2 border-[#3a2d1e] bg-[#1f1812] px-2 py-0.5 text-[10px] font-bold text-[#a89880]">
      ⏳ 波次间隔 {d.restRemainingS}s
    </span>
  );
}
