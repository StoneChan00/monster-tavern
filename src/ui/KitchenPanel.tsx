import { useState } from 'react';
import { Panel } from './Panel';
import { Bar } from './Bar';
import { useGameStore } from '../store/gameStore';
import { RECIPES } from '../data/recipes';
import { MATERIALS } from '../data/materials';
import { fmtDuration } from '../utils/format';

/** 厨房面板：菜谱 / 烹饪进度 / 生效中的菜肴 buff */
export function KitchenPanel() {
  const s = useGameStore((st) => st.state);
  const [hint, setHint] = useState('');
  const recipe = RECIPES.recipe_gel_soup;
  const job = s.kitchen.job;
  const needGel = recipe.cost.materials.mat_gel ?? 0;
  const haveGel = s.inventory.mat_gel ?? 0;
  const goldOk = s.player.gold >= recipe.cost.gold;
  const gelOk = haveGel >= needGel;
  const canCook = !job && goldOk && gelOk;
  const reason = job ? '厨房正忙…' : !goldOk ? '金币不足' : !gelOk ? `魔物凝胶不足（${haveGel}/${needGel}）` : '';

  const onCook = () => {
    const r = useGameStore.getState().cook(recipe.id);
    setHint(r.ok ? '' : r.message);
  };

  return (
    <Panel title="厨房" icon="🍲">
      <div className="space-y-2 text-xs">
        <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2">
          <div className="flex items-center justify-between">
            <span className="font-bold">
              {recipe.icon} {recipe.name}
            </span>
            <span className="text-[10px] text-[#7cb342]">已解锁</span>
          </div>
          <div className="mt-1.5 space-y-0.5 text-[11px] text-[#a89880]">
            <div>
              费用：💰{recipe.cost.gold} + {MATERIALS.mat_gel.icon}
              {MATERIALS.mat_gel.name}×{needGel}
            </div>
            <div>效果：{recipe.buff.label} · 持续 {fmtDuration(recipe.buff.durationS)} · 忠诚 +{recipe.mealLoyalty}</div>
            <div>烹饪时长：{fmtDuration(recipe.cookTimeS)}（离线也照常炖煮）</div>
          </div>
        </div>

        {job ? (
          <div className="border-2 border-[#8a6a2a] bg-[#2b2118] p-2">
            <div className="mb-1 flex justify-between">
              <span className="font-bold text-[#f0d78c]">
                <span className="cooking-bub">🔥</span> 烹饪中…
              </span>
              <span className="tabular-nums text-[#a89880]">剩 {fmtDuration(job.remainingS)}</span>
            </div>
            <Bar value={job.totalS - job.remainingS} max={job.totalS} color="#d9a441" height="h-3" />
          </div>
        ) : (
          <button type="button" className="pixel-btn pixel-btn-primary w-full" disabled={!canCook} onClick={onCook}>
            {canCook ? `开始烹饪（${MATERIALS.mat_gel.icon}×${needGel}）` : reason}
          </button>
        )}
        {hint ? <div className="text-[11px] text-[#c0392b]">{hint}</div> : null}

        {s.kitchen.buffs.length > 0 ? (
          <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2">
            <div className="mb-1 text-[10px] font-bold text-[#a89880]">当前菜肴效果</div>
            {s.kitchen.buffs.map((b) => (
              <div key={b.recipeId} className="flex justify-between text-[11px]">
                <span className="text-[#f0d78c]">
                  {RECIPES[b.recipeId]?.icon} {b.label}
                </span>
                <span className="tabular-nums text-[#a89880]">{fmtDuration(b.remainingS)}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Panel>
  );
}
