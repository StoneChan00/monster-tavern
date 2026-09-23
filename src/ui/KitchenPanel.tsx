import { useState } from 'react';
import { Panel } from './Panel';
import { Bar } from './Bar';
import { useGameStore } from '../store/gameStore';
import { RECIPES } from '../data/recipes';
import { MATERIALS } from '../data/materials';
import { CLASSES } from '../data/classes';
import { kitchenBuffSlots } from '../data/balance';
import { fmtDuration } from '../utils/format';
import type { RecipeDef } from '../data/recipes';

/** 厨房页签：烹饪进度 / 生效菜肴 / 菜谱图鉴 */
export function KitchenPanel() {
  const s = useGameStore((st) => st.state);
  const [hint, setHint] = useState('');
  const job = s.kitchen.job;
  const slots = kitchenBuffSlots(s.tavern.kitchen);

  const onCook = (recipeId: string) => {
    const r = useGameStore.getState().cook(recipeId as keyof typeof RECIPES);
    setHint(r.ok ? '' : r.message);
  };

  return (
    <div className="space-y-3">
      {/* 烹饪与生效 buff */}
      <Panel title="灶台" icon="🍳">
        <div className="space-y-2 text-xs">
          {job ? (
            <div className="border-2 border-[#8a6a2a] bg-[#2b2118] p-2">
              <div className="mb-1 flex justify-between">
                <span className="font-bold text-[#f0d78c]">
                  <span className="cooking-bub">🔥</span> 烹饪「{RECIPES[job.recipeId]?.name}」…
                </span>
                <span className="tabular-nums text-[#a89880]">剩 {fmtDuration(Math.ceil(job.remainingS))}</span>
              </div>
              <Bar value={job.totalS - job.remainingS} max={job.totalS} color="#d9a441" height="h-3" />
            </div>
          ) : (
            <p className="text-[#a89880]">灶台空闲——从下面挑一道菜开始烹饪吧。</p>
          )}

          <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2">
            <div className="mb-1 text-[10px] font-bold text-[#a89880]">
              当前菜肴效果（{s.kitchen.buffs.length}/{slots} 道 · 升级厨房增加栏位）
            </div>
            {s.kitchen.buffs.length === 0 ? (
              <div className="text-[11px] text-[#5b4d3a]">暂无生效菜肴</div>
            ) : (
              s.kitchen.buffs.map((b) => (
                <div key={b.recipeId} className="flex justify-between text-[11px]">
                  <span className="text-[#f0d78c]">
                    {RECIPES[b.recipeId]?.icon} {b.label}
                  </span>
                  <span className="tabular-nums text-[#a89880]">{fmtDuration(b.remainingS)}</span>
                </div>
              ))
            )}
          </div>
          {hint ? <div className="text-[11px] text-[#c0392b]">{hint}</div> : null}
        </div>
      </Panel>

      {/* 菜谱图鉴 */}
      <Panel title={`菜谱图鉴（${s.kitchen.unlockedRecipes.length}/${Object.keys(RECIPES).length}）`} icon="📖">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {Object.values(RECIPES).map((r) => (
            <RecipeCard key={r.id} recipe={r} onCook={onCook} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function unlockText(recipe: RecipeDef): string {
  if (recipe.unlock.type === 'initial') return '';
  if (recipe.unlock.type === 'mapClear') {
    const names = ['苔藓洞窟', '秘银矿道', '骸骨墓穴', '熔岩裂隙', '水晶回廊', '虚空终焉'];
    return `首杀${names[recipe.unlock.map - 1] ?? `图${recipe.unlock.map}`}（图${recipe.unlock.map}）BOSS 解锁`;
  }
  return `声望 ${recipe.unlock.value} 解锁`;
}

function RecipeCard({ recipe, onCook }: { recipe: RecipeDef; onCook: (id: string) => void }) {
  const s = useGameStore((st) => st.state);
  const unlocked = s.kitchen.unlockedRecipes.includes(recipe.id);
  const cooking = s.kitchen.job !== null;

  if (!unlocked) {
    return (
      <div className="border-2 border-[#3a2d1e] bg-[#171008] p-2 text-xs text-[#5b4d3a]">
        <div className="font-bold">🔒 {recipe.name}</div>
        <div className="mt-1 text-[11px]">{unlockText(recipe)}</div>
      </div>
    );
  }

  const goldOk = s.player.gold >= recipe.cost.gold;
  const matOk = Object.entries(recipe.cost.materials).every(
    ([mid, need]) => (s.inventory[mid] ?? 0) >= (need ?? 0),
  );
  const canCook = !cooking && goldOk && matOk;
  const reason = cooking ? '灶台正忙' : !goldOk ? '金币不足' : '材料不足';
  const attract = recipe.attraction.classIds.map((c) => CLASSES[c].name).join('、');

  return (
    <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold">
          {recipe.icon} {recipe.name}
        </span>
      </div>
      {recipe.desc ? (
        <div className="mt-1 text-[10px] italic leading-relaxed text-[#8a7a62]">"{recipe.desc}"</div>
      ) : null}
      <div className="mt-1.5 space-y-0.5 text-[11px] text-[#a89880]">
        <div>
          费用：💰{recipe.cost.gold}
          {Object.entries(recipe.cost.materials).map(([mid, need]) => (
            <span key={mid}>
              {' '}
              + {MATERIALS[mid]?.icon}
              {MATERIALS[mid]?.name}×{need}
            </span>
          ))}
        </div>
        <div>
          效果：{recipe.buff.label} · 持续 {fmtDuration(recipe.buff.durationS)} · 众人忠诚 +{recipe.mealLoyalty}
        </div>
        <div>烹饪：{fmtDuration(recipe.cookTimeS)} · 吸引：{attract}</div>
      </div>
      <button
        type="button"
        className="pixel-btn pixel-btn-primary mt-1.5 w-full"
        disabled={!canCook}
        onClick={() => onCook(recipe.id)}
      >
        {canCook ? '开始烹饪' : reason}
      </button>
    </div>
  );
}
