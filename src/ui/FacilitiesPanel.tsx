import { useState } from 'react';
import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { FACILITIES, type FacilityDef } from '../data/upgrades';
import { MATERIALS } from '../data/materials';

/** 酒馆页签：在营设施升级（训练场/情报网已下架，注册表自动过滤） */
export function FacilitiesPanel() {
  return (
    <div className="space-y-3">
      <Panel title="酒馆设施" icon="🍺">
        <div className="space-y-2">
          {Object.values(FACILITIES)
            .filter((f): f is FacilityDef => f !== undefined)
            .map((f) => (
              <FacilityCard key={f.id} facility={f} />
            ))}
        </div>
      </Panel>
    </div>
  );
}

function FacilityCard({ facility }: { facility: FacilityDef }) {
  const s = useGameStore((st) => st.state);
  const [hint, setHint] = useState('');
  const lv = s.tavern[facility.id];
  const maxed = lv >= facility.maxLevel;
  const cost = maxed ? null : facility.cost(lv);

  const goldOk = cost ? s.player.gold >= cost.gold : false;
  const repOk = cost ? (cost.reputation ?? 0) <= s.player.reputation : false;
  const recipeOk = cost ? (cost.unlockedRecipes ?? 0) <= s.kitchen.unlockedRecipes.length : false;
  const matOk = cost
    ? Object.entries(cost.materials).every(([mid, need]) => (s.inventory[mid] ?? 0) >= (need ?? 0))
    : false;
  const canUp = !maxed && goldOk && repOk && recipeOk && matOk;
  const reason = !goldOk ? '金币不足' : !repOk ? '声望不足' : !recipeOk ? '菜谱不足' : '材料不足';

  return (
    <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold">
          {facility.icon} {facility.name}
        </span>
        <span className="font-bold text-[#f0d78c]">
          Lv.{lv}
          <span className="text-[#a89880]"> / {facility.maxLevel}</span>
        </span>
      </div>
      <div className="mt-1 text-[11px] text-[#a89880]">当前效果：{facility.describe(lv)}</div>

      {maxed ? (
        <div className="mt-1.5 text-center text-[11px] font-bold text-[#d9a441]">🏆 已达最高等级</div>
      ) : (
        <>
          <div className="mt-1 text-[11px] text-[#a89880]">
            升级费用：💰{cost!.gold}
            {cost!.reputation ? ` · ⭐${cost!.reputation}` : ''}
            {cost!.unlockedRecipes ? ` · 📖菜谱${cost!.unlockedRecipes}道` : ''}
            {Object.entries(cost!.materials).map(([mid, need]) => (
              <span key={mid}>
                {' '}+ {MATERIALS[mid]?.icon}
                {MATERIALS[mid]?.name}×{need}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="pixel-btn pixel-btn-primary mt-1.5 w-full"
            disabled={!canUp}
            onClick={() => {
              const r = useGameStore.getState().upgradeFacility(facility.id);
              setHint(r.ok ? '' : r.message);
            }}
          >
            {canUp ? `升级到 Lv.${lv + 1}` : reason}
          </button>
          {hint ? <div className="mt-1 text-[10px] text-[#c0392b]">{hint}</div> : null}
        </>
      )}
    </div>
  );
}
