import { Panel } from './Panel';
import { Bar } from './Bar';
import { BattleViewport } from './BattleViewport';
import { MonsterSprite } from './SpriteIcon';
import { CharacterSprite } from './CharacterSprite';
import { useGameStore } from '../store/gameStore';
import { BALANCE } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { MAPS, MAP_DEFS, MONSTERS } from '../data/monsters';
import { getAdventurerStats, levelTier } from '../engine/stats';
import { getPartyMembers, isSlotUnlocked } from '../engine/party';
import { fmtDuration, fmtNum } from '../utils/format';
import type { GameState, LogKind } from '../engine/types';

const LOG_COLORS: Record<LogKind, string> = {
  combat: 'text-slate-300',
  loot: 'text-amber-300',
  level: 'text-green-300',
  kitchen: 'text-orange-300',
  tavern: 'text-sky-300',
  system: 'text-purple-300',
};

const MAP_LABEL = ['一', '二', '三', '四', '五', '六'];

/** 编队槽位行：前排承伤 / 中排标准 / 后排受保护 */
const ROWS: Array<{ label: string; icon: string; slots: number[] }> = [
  { label: '前排', icon: '🛡️', slots: [0, 3] },
  { label: '中排', icon: '⚔️', slots: [1, 4] },
  { label: '后排', icon: '🏹', slots: [2] },
];

/** 地牢面板：选图 / 队伍状态 / 魔物 / 战斗日志（地图制无限循环） */
export function DungeonPanel() {
  const s = useGameStore((st) => st.state);
  const map = MAPS[s.dungeon.mapId] ?? MAP_DEFS[0];
  const logs = [...s.log].reverse().slice(0, 14);
  const members = getPartyMembers(s);
  const bossWave = map.bossPool.includes(s.dungeon.monsters[0]?.monsterId ?? '');

  return (
    <div className="space-y-3">
      {/* 地图选择 */}
      <Panel title="地牢地图（首杀本图 BOSS 解锁下一张）" icon="🗺️">
        <div className="flex flex-wrap gap-1.5">
          {MAP_DEFS.map((m) => {
            const locked = m.number > s.dungeon.unlockedMaps;
            const active = m.number === s.dungeon.activeMap;
            const cleared = s.meta.mapsFirstCleared.includes(m.number);
            return (
              <button
                key={m.id}
                type="button"
                disabled={locked}
                onClick={() => useGameStore.getState().setActiveMap(m.number)}
                className={`border-2 px-2 py-1 text-[11px] font-bold ${
                  active
                    ? 'border-[#d9a441] bg-[#3a2d1e] text-[#f0d78c]'
                    : locked
                      ? 'cursor-not-allowed border-[#3a2d1e] bg-[#171008] text-[#5b4d3a]'
                      : 'border-[#3a2d1e] bg-[#1f1812] text-[#a89880] hover:bg-[#2b2118]'
                }`}
                title={locked ? '尚未解锁（首杀上一张图的 BOSS）' : m.name}
              >
                {locked ? '🔒' : m.icon} {MAP_LABEL[m.number - 1]}·{m.name}
                {cleared ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </Panel>

      {/* 编队（前中后排站位） */}
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
          <div className="text-center text-[10px] text-[#6b5d48]">
            冒险者的详细状态（历练/忠诚/升级仪式）在「宿舍」页签
          </div>
        </div>
      </Panel>

      {/* 队伍与战斗 */}
      <Panel
        title={
          <span className="flex flex-wrap items-baseline gap-x-2">
            {map.icon} {map.name}
            <span className="text-[10px] font-normal text-[#a89880]">
              本图清波 {fmtNum(s.dungeon.waveCount)} · 累计 {fmtNum(s.meta.totalWavesCleared)} · BOSS 击杀{' '}
              {s.meta.totalBossKills}
            </span>
          </span>
        }
        icon="⚔️"
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
                  无人出征——在上方「编队」指派冒险者吧！
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
                const isBoss = map.bossPool.includes(m.monsterId);
                return (
                  <div
                    key={m.uid}
                    className={`flex items-center gap-2 border-2 p-1.5 ${
                      isBoss ? 'border-[#8a3a2a] bg-[#2a1512]' : 'border-[#3a2d1e] bg-[#1f1812]'
                    } ${dead ? 'opacity-40 grayscale' : ''}`}
                  >
                    <MonsterSprite monsterId={m.monsterId} fallback={def.icon} size={isBoss ? 26 : 20} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <span className={isBoss ? 'font-bold text-[#f0d78c]' : ''}>
                          {isBoss ? '👑 ' : ''}
                          {def.name}
                        </span>
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

          {/* 循环提示 */}
          <div className="text-center text-[10px] text-[#6b5d48]">
            {bossWave
              ? '👑 BOSS 波！击杀后可能解锁新地图'
              : '魔物无限循环涌来，每波约 5% 概率遭遇 BOSS'}
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

/** 单个编队槽位卡：成员血条 + 指派下拉 */
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
            <span className="truncate font-bold" style={{ color: levelTier(adv.level).color }}>
              {adv.name}
            </span>
            <span className="ml-auto shrink-0 text-[10px] text-[#a89880]">
              {RACES[adv.race]?.name ?? '人类'} · {CLASSES[adv.classId].name} ·{' '}
              <span style={{ color: levelTier(adv.level).color }}>Lv{adv.level}</span>
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
