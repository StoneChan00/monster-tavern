import { Panel } from './Panel';
import { Bar } from './Bar';
import { CharacterSprite } from './CharacterSprite';
import { useGameStore } from '../store/gameStore';
import { BALANCE, levelUpCost, wageOfLevel } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { MATERIALS } from '../data/materials';
import { expToNext, getAdventurerStats, levelTier } from '../engine/stats';
import { LEVEL_CAP } from '../engine/types';
import type { AdventurerState } from '../engine/types';

const ROW_LABEL: Record<string, string> = { front: '前排', mid: '中排', back: '后排' };

/** 冒险者详情卡（宿舍名册通用）：D&D 等级制，经验满可花金币+材料进行升级仪式 */
export function AdventurerCard({ adv }: { adv: AdventurerState }) {
  const s = useGameStore((st) => st.state);
  const cls = CLASSES[adv.classId];
  const stats = getAdventurerStats(s, adv);
  const need = expToNext(adv.level);
  const atCap = adv.level >= LEVEL_CAP;
  const expReady = adv.exp >= need;
  const hp = Math.min(adv.hp, stats.hp);
  const slot = s.party.indexOf(adv.id);
  const inParty = slot >= 0;
  const rowLabel = inParty ? (ROW_LABEL[BALANCE.SLOT_ROWS[slot]] ?? '') : '';
  const wage = wageOfLevel(adv.level);
  const tier = levelTier(adv.level);
  // 升级仪式费用：2/3 级用普通掉落，3→8 级对应图 1-5 精英材料，9/10 暂未开放
  const upgradeLocked = adv.level >= BALANCE.UPGRADE_CAP;
  const cost = upgradeLocked || atCap ? null : levelUpCost(adv.level + 1, adv.classId);

  const canPay =
    cost !== null &&
    s.player.gold >= cost.gold &&
    Object.entries(cost.materials).every(([mid, cnt]) => (s.inventory[mid] ?? 0) >= (cnt ?? 0));
  const missingText =
    cost === null
      ? ''
      : s.player.gold < cost.gold
        ? '金币不足'
        : Object.entries(cost.materials)
            .filter(([mid, cnt]) => (s.inventory[mid] ?? 0) < (cnt ?? 0))
            .map(([mid, cnt]) => `${MATERIALS[mid]?.name ?? mid} 不足（还需 ${(cnt ?? 0) - (s.inventory[mid] ?? 0)}）`)
            .join('，') || '材料不足';

  return (
    <Panel
      title={
        <span style={{ color: tier.color }}>
          {adv.name} · Lv.{adv.level} {tier.label}
        </span>
      }
      icon={<CharacterSprite classId={adv.classId} size={18} />}
    >
      <div className="space-y-2 text-xs">
        <div className="flex items-baseline justify-between">
          <span className="text-[#a89880]">
            {RACES[adv.race]?.name ?? '人类'} · {cls.name} · {cls.role.split(' / ')[0]}
            {inParty ? (
              <span className="font-bold text-[#8fbf6a]"> · ⚔️ 队伍中{rowLabel ? `（${rowLabel}）` : ''}</span>
            ) : (
              <span className="text-[#c9b28a]"> · 🛏️ 休息中</span>
            )}
          </span>
          <span className="font-bold text-[#f0d78c]">
            Lv.{adv.level}
            <span className="text-[#a89880]"> / {LEVEL_CAP}</span>
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
            <span className="text-[#a89880]">✨ 历练{atCap ? '（已达传奇之巅）' : expReady ? '（可进行升级仪式）' : ''}</span>
            <span className="tabular-nums">{atCap ? '—' : `${adv.exp} / ${need}`}</span>
          </div>
          <Bar
            value={atCap ? 1 : adv.exp}
            max={atCap ? 1 : need}
            color={expReady && !atCap ? '#ffd24a' : '#7e57c2'}
          />
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

        {atCap ? (
          <div className="border-2 border-[#8a6d2f] bg-[#2a2115] p-1.5 text-center text-[11px] font-bold text-[#f0d78c]">
            ⭐ 10 级传奇——这个世界没有更强的了
          </div>
        ) : upgradeLocked ? (
          <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-1.5 text-center text-[11px] font-bold text-[#a89880]">
            🔒 9、10 级仪式暂未开放（当前上限 8 级，高等级只能靠稀有访客）
          </div>
        ) : expReady ? (
          <div className="space-y-1">
            <div className="text-[10px] text-[#a89880]">
              升级仪式：💰{cost!.gold}
              {Object.entries(cost!.materials).map(([mid, cnt]) => (
                <span key={mid}>
                  {' '}+ {MATERIALS[mid]?.icon}
                  {MATERIALS[mid]?.name}×{cnt}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="pixel-btn pixel-btn-primary w-full"
              disabled={!canPay}
              onClick={() => {
                const r = useGameStore.getState().levelUpAdventurer(adv.id);
                if (!r.ok) window.alert(r.message);
              }}
            >
              {canPay ? `✨ 升级到 Lv.${adv.level + 1}（${levelTier(adv.level + 1).label}）` : missingText}
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="pixel-btn pixel-btn-danger w-full"
          onClick={() => {
            if (window.confirm(`确定解雇 ${adv.name} 吗？此操作不可恢复。`)) {
              useGameStore.getState().dismissAdventurer(adv.id);
            }
          }}
        >
          解雇
        </button>
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
