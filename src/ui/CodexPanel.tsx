import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { MONSTERS, MAP_DEFS } from '../data/monsters';
import { MONSTER_SPRITES } from '../data/sprites';
import {
  ACHIEVEMENTS,
  CODEX_MONSTER_MAP,
  CODEX_MONSTER_ORDER,
  MONSTER_SPECIES_COUNT,
  discoveredMonsterCount,
  totalMonsterKills,
} from '../data/achievements';
import { fmtDuration, fmtNum } from '../utils/format';

const MAP_NAMES = MAP_DEFS.map((m) => m.name);

/** 图鉴页签：统计概览 + 成就墙 + 魔物图鉴 */
export function CodexPanel() {
  const s = useGameStore((st) => st.state);

  const playSeconds = Math.max(0, (s.meta.now - s.meta.createdAt) / 1000);
  const kills = totalMonsterKills(s);
  const discovered = discoveredMonsterCount(s);
  const achieved = ACHIEVEMENTS.filter((a) => a.check(s));

  const stats: Array<{ label: string; value: string }> = [
    { label: '游玩时长', value: fmtDuration(playSeconds) },
    { label: '累计金币', value: fmtNum(s.meta.lifetimeGoldEarned) },
    { label: '累计经验', value: fmtNum(s.meta.lifetimeExpEarned) },
    { label: '累计击杀', value: fmtNum(kills) },
    { label: '清波次数', value: fmtNum(s.meta.totalWavesCleared) },
    { label: '精英讨伐', value: fmtNum(s.meta.totalBossKills) },
    { label: '累计出餐', value: fmtNum(s.meta.dishesCooked) },
    { label: '已解锁地图', value: `${s.dungeon.unlockedMaps} / ${MAP_DEFS.length}` },
  ];

  return (
    <div className="space-y-3">
      <Panel title="酒馆志" icon="📊">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((st) => (
            <div key={st.label} className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-center">
              <div className="text-[10px] text-[#a89880]">{st.label}</div>
              <div className="mt-0.5 text-sm font-bold text-[#f0d78c]">{st.value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title={`成就 ${achieved.length} / ${ACHIEVEMENTS.length}`}
        icon="🏆"
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const done = a.check(s);
            return (
              <div
                key={a.id}
                className={`border-2 p-2 text-xs ${
                  done
                    ? 'border-[#8a6d2f] bg-[#2a2115]'
                    : 'border-[#3a2d1e] bg-[#1f1812] opacity-60 grayscale'
                }`}
                title={a.desc}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{done ? a.icon : '🔒'}</span>
                  <span className={`font-bold ${done ? 'text-[#f0d78c]' : 'text-[#a89880]'}`}>{a.name}</span>
                </div>
                <div className="mt-1 text-[10px] text-[#a89880]">{a.desc}</div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title={`魔物图鉴 ${discovered} / ${MONSTER_SPECIES_COUNT}`} icon="📖">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">
          {CODEX_MONSTER_ORDER.map((mid) => {
            const def = MONSTERS[mid];
            const killsOf = s.meta.monsterKills[mid] ?? 0;
            const discoveredThis = killsOf > 0;
            const sprite = MONSTER_SPRITES[mid];
            const mapNum = CODEX_MONSTER_MAP[mid];
            return (
              <div
                key={mid}
                className="flex flex-col items-center gap-1 border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-center"
                title={discoveredThis ? def.name : '尚未遭遇'}
              >
                {discoveredThis ? (
                  sprite ? (
                    <img
                      src={`/sprites/monsters/${sprite}`}
                      alt={def.name}
                      width={36}
                      height={36}
                      draggable={false}
                      className="pixel-img"
                    />
                  ) : (
                    <span className="text-2xl leading-none">{def.icon}</span>
                  )
                ) : sprite ? (
                  <img
                    src={`/sprites/monsters/${sprite}`}
                    alt=""
                    width={36}
                    height={36}
                    draggable={false}
                    className="pixel-img opacity-70"
                    style={{ filter: 'brightness(0)' }}
                  />
                ) : (
                  <span className="text-2xl leading-none text-[#3a2d1e]">❓</span>
                )}
                <div className={`text-[11px] font-bold ${discoveredThis ? 'text-[#f0e6d2]' : 'text-[#6b5d48]'}`}>
                  {discoveredThis ? def.name : '？？？'}
                </div>
                <div className="text-[10px] text-[#6b5d48]">
                  {discoveredThis
                    ? `击杀 ×${fmtNum(killsOf)}`
                    : mapNum
                      ? `${MAP_NAMES[mapNum - 1] ?? mapNum} 出没`
                      : '？？？'}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
