import { Panel } from './Panel';
import { Bar } from './Bar';
import { BattleViewport } from './BattleViewport';
import { MonsterSprite } from './SpriteIcon';
import { useGameStore } from '../store/gameStore';
import { CLASSES } from '../data/classes';
import { FLOOR_DEFS, FLOORS, MONSTERS } from '../data/monsters';
import { getAdventurerStats } from '../engine/stats';
import { getPartyMembers } from '../engine/party';
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

/** 地牢面板：选层 / 队伍状态 / 魔物 / 战斗日志 */
export function DungeonPanel() {
  const s = useGameStore((st) => st.state);
  const floor = FLOORS[s.dungeon.floorId];
  const logs = [...s.log].reverse().slice(0, 14);
  const members = getPartyMembers(s);

  return (
    <div className="space-y-3">
      {/* 楼层选择 */}
      <Panel title="地牢楼层" icon="🗺️">
        <div className="flex flex-wrap gap-1.5">
          {FLOOR_DEFS.map((f) => {
            const locked = f.number > s.dungeon.highestFloor;
            const active = f.number === s.dungeon.farmFloor;
            return (
              <button
                key={f.id}
                type="button"
                disabled={locked}
                onClick={() => useGameStore.getState().setFarmFloor(f.number)}
                className={`border-2 px-2 py-1 text-[11px] font-bold ${
                  active
                    ? 'border-[#d9a441] bg-[#3a2d1e] text-[#f0d78c]'
                    : locked
                      ? 'cursor-not-allowed border-[#3a2d1e] bg-[#171008] text-[#5b4d3a]'
                      : 'border-[#3a2d1e] bg-[#1f1812] text-[#a89880] hover:bg-[#2b2118]'
                }`}
                title={locked ? '尚未解锁' : f.name}
              >
                {locked ? '🔒' : f.icon} {f.number}层
              </button>
            );
          })}
        </div>
      </Panel>

      {/* 队伍与战斗 */}
      <Panel
        title={
          <span className="flex flex-wrap items-baseline gap-x-2">
            {floor.name}
            <span className="text-[10px] font-normal text-[#a89880]">
              累计清波 {fmtNum(s.meta.totalWavesCleared)} · BOSS 击杀 {s.meta.totalBossKills}
            </span>
          </span>
        }
        icon={floor.icon}
      >
        <div className="space-y-3 text-xs">
          {/* 战斗视口（事件流回放） */}
          <BattleViewport />

          {/* 队伍血条 */}
          <div>
            <div className="mb-1 flex items-center justify-between text-[10px] font-bold text-[#a89880]">
              <span>🧑‍🤝‍🧑 出征队伍</span>
              <StatusBadge />
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 lg:grid-cols-5">
              {members.length === 0 ? (
                <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-center text-[#a89880] sm:col-span-3 lg:col-span-5">
                  无人出征——去「冒险者」页签编队吧！
                </div>
              ) : (
                members.map((m) => {
                  const cls = CLASSES[m.adv.classId];
                  const maxHp = getAdventurerStats(s, m.adv).hp;
                  const hp = Math.min(m.adv.hp, maxHp);
                  const dead = m.adv.hp <= 0;
                  return (
                    <div
                      key={m.adv.id}
                      className={`border-2 border-[#3a2d1e] bg-[#1f1812] p-1.5 ${dead ? 'opacity-40 grayscale' : ''}`}
                    >
                      <div className="flex items-center gap-1">
                        <span>{cls.icon}</span>
                        <span className="truncate text-[11px]">{m.adv.name}</span>
                        <span className="ml-auto text-[10px] text-[#a89880]">Lv{m.adv.level}</span>
                      </div>
                      <Bar value={hp} max={maxHp} color={dead ? '#555' : '#7cb342'} height="h-2" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 波次进度 */}
          <div className="flex flex-wrap items-center gap-1">
            {floor.waves.map((w, i) => {
              const current = i === s.dungeon.waveIndex && s.dungeon.status !== 'resting';
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

          {/* 魔物 */}
          <div className="space-y-1.5">
            {s.dungeon.monsters.length === 0 ? (
              <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-3 text-center text-[#a89880]">
                {s.dungeon.status === 'resting' ? '队伍在酒馆休整中……' : '新的波次即将到来……'}
              </div>
            ) : (
              s.dungeon.monsters.map((m) => {
                const def = MONSTERS[m.monsterId];
                const dead = m.hp <= 0;
                return (
                  <div
                    key={m.uid}
                    className={`flex items-center gap-2 border-2 border-[#3a2d1e] bg-[#1f1812] p-1.5 ${
                      dead ? 'opacity-40 grayscale' : ''
                    }`}
                  >
                    <MonsterSprite monsterId={m.monsterId} fallback={def.icon} />
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
          <div className="border-2 border-[#3a2d1e] bg-[#141009] p-2">
            <div className="mb-1 text-[10px] font-bold text-[#a89880]">⚔️ 战斗记录</div>
            <ul className="h-44 space-y-0.5 overflow-y-auto text-[11px] leading-relaxed">
              {logs.map((e) => (
                <li key={e.id} className={LOG_COLORS[e.kind]}>
                  {e.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
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
