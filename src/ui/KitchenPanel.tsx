import { useState } from 'react';
import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { RECIPES, CATEGORY_LABEL, type RecipeDef } from '../data/recipes';
import { MATERIALS } from '../data/materials';
import { CLASSES } from '../data/classes';
import { MENU_CONFIG, menuConfig } from '../data/balance';
import { activeMenuRecipes, activeMenuStructures } from '../engine/stats';
import { fmtDuration } from '../utils/format';

/**
 * 厨房页签（v7 菜单制）：设置菜单 → 每小时消耗材料维持供给。
 * 菜品效果随供料独立生效；满足结构（前菜+主菜+饮品…）获得**额外加成**，
 * 结构嵌套（高级 ⊇ 低级），效果叠加。
 */
export function KitchenPanel() {
  const s = useGameStore((st) => st.state);
  const cfg = menuConfig(s.tavern.kitchen);
  const [hint, setHint] = useState('');
  const nextCycle = Math.max(0, (s.kitchen.nextMenuCycleAt - s.meta.now) / 1000);
  const active = activeMenuRecipes(s);
  const structures = activeMenuStructures(s);

  return (
    <div className="space-y-3">
      <Panel
        title={
          <span className="flex flex-wrap items-baseline gap-x-2">
            今日菜单（{s.kitchen.menu.filter((x) => x !== null).length}/{cfg.slots} 道 · 每小时供料）
            <span className="text-[10px] font-normal text-[#a89880]">
              下次供料 {fmtDuration(nextCycle)} 后
            </span>
          </span>
        }
        icon="🍳"
      >
        <div className="space-y-2 text-xs">
          {/* 结构加成（嵌套：满足高级自动满足低级，效果叠加） */}
          <div className="border-2 border-[#3a2d1e] bg-[#141009] p-2">
            <div className="mb-1 text-[10px] font-bold text-[#a89880]">
              结构加成（满足类别要求即生效，可叠加）
            </div>
            <div className="space-y-0.5">
              {[1, 2, 3, 4].map((lv) => {
                const m = MENU_CONFIG[lv];
                const on = structures.includes(lv);
                const locked = s.tavern.kitchen < lv;
                return (
                  <div
                    key={lv}
                    className={`flex items-baseline justify-between text-[11px] ${
                      on ? 'text-[#a5d47a]' : locked ? 'text-[#5b4d3a]' : 'text-[#a89880]'
                    }`}
                  >
                    <span>
                      {on ? '✓' : locked ? '🔒' : '·'} {m.bonus.name}（{m.required.length} 类：{m.required.map((c) => CATEGORY_LABEL[c]).join('+')}）
                    </span>
                    <span>{m.bonus.desc}</span>
                  </div>
                );
              })}
              {s.tavern.kitchen === 0 ? (
                <div className="text-[10px] text-[#6b5d48]">升级厨房解锁更多槽位与结构加成</div>
              ) : null}
            </div>
          </div>

          {/* 菜单槽位 */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: cfg.slots }, (_, i) => (
              <MenuSlot key={i} slot={i} onHint={setHint} />
            ))}
          </div>

          {/* 生效增益 */}
          <div className="border-2 border-[#3a2d1e] bg-[#141009] p-2">
            <div className="mb-1 text-[10px] font-bold text-[#a89880]">
              当前生效效果（{active.length} 道菜{structures.length > 0 ? ` + ${structures.length} 级结构` : ''}）
            </div>
            {active.length === 0 && structures.length === 0 ? (
              <div className="text-[11px] text-[#5b4d3a]">暂无——设菜并保持供料</div>
            ) : (
              <>
                {active.map((id) => {
                  const r = RECIPES[id];
                  if (!r) return null;
                  return (
                    <div key={id} className="flex justify-between text-[11px]">
                      <span className="text-[#f0d78c]">
                        {r.icon} {r.name}（{CATEGORY_LABEL[r.category]}）
                      </span>
                      <span className="text-[#a89880]">{r.buff.label}</span>
                    </div>
                  );
                })}
                {structures.map((lv) => (
                  <div key={lv} className="flex justify-between text-[11px]">
                    <span className="text-[#a5d47a]">🍽️ {MENU_CONFIG[lv].bonus.name}</span>
                    <span className="text-[#a5d47a]">{MENU_CONFIG[lv].bonus.desc}</span>
                  </div>
                ))}
              </>
            )}
          </div>
          {hint ? <div className="text-[11px] text-[#c0392b]">{hint}</div> : null}
        </div>
      </Panel>

      {/* 菜谱图鉴 */}
      <Panel title={`菜谱图鉴（${s.kitchen.unlockedRecipes.length}/${Object.keys(RECIPES).length}）`} icon="📖">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {Object.values(RECIPES).map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </Panel>
    </div>
  );
}

function MenuSlot({ slot, onHint }: { slot: number; onHint: (h: string) => void }) {
  const s = useGameStore((st) => st.state);
  const recipeId = s.kitchen.menu[slot];
  const fed = s.kitchen.menuFed[slot];
  const r = recipeId ? RECIPES[recipeId] : undefined;

  const onChange = (value: string) => {
    const result = useGameStore.getState().setMenuSlot(slot, value === '' ? null : (value as never));
    if (!result.ok) onHint(result.message);
  };

  return (
    <div
      className={`border-2 p-2 ${
        r ? (fed ? 'border-[#4a6b2f] bg-[#1d2415]' : 'border-[#8a6a2a] bg-[#2b2118]') : 'border-[#3a2d1e] bg-[#1f1812]'
      }`}
    >
      {r ? (
        <div className="mb-1 flex items-baseline justify-between">
          <span className={`text-xs font-bold ${fed ? 'text-[#a5d47a]' : 'text-[#f0d78c]'}`}>
            {r.icon} {r.name}
            <span className="ml-1 text-[10px] font-normal text-[#a89880]">{CATEGORY_LABEL[r.category]}</span>
          </span>
          <span className={`text-[10px] ${fed ? 'text-[#a5d47a]' : 'text-[#c0392b]'}`}>
            {fed ? '供给中' : '缺料暂停'}
          </span>
        </div>
      ) : (
        <div className="mb-1 py-0.5 text-center text-xs text-[#5b4d3a]">（空位）</div>
      )}
      <select className="pixel-select w-full" value={recipeId ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">（下架/空位）</option>
        {Object.values(RECIPES)
          .filter((x) => s.kitchen.unlockedRecipes.includes(x.id) && !s.kitchen.menu.includes(x.id))
          .map((x) => (
            <option key={x.id} value={x.id}>
              {x.icon} {x.name} · {CATEGORY_LABEL[x.category]}
            </option>
          ))}
      </select>
      {r ? (
        <div className="mt-1 text-[10px] text-[#a89880]">
          效果 {r.buff.label} · 每小时：
          {Object.entries(r.cost.materials).map(([mid, need]) => (
            <span key={mid}>
              {' '}
              {MATERIALS[mid]?.icon}
              {MATERIALS[mid]?.name}×{need}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function unlockText(recipe: RecipeDef): string {
  if (recipe.unlock.type === 'initial') return '';
  if (recipe.unlock.type === 'mapClear') {
    const names = ['苔藓洞窟', '秘银矿道', '骸骨墓穴', '熔岩裂隙', '水晶回廊', '虚空终焉'];
    return `讨伐${names[recipe.unlock.map - 1] ?? `图${recipe.unlock.map}`}（图${recipe.unlock.map}）精英解锁`;
  }
  return `声望 ${recipe.unlock.value} 解锁`;
}

function RecipeCard({ recipe }: { recipe: RecipeDef }) {
  const s = useGameStore((st) => st.state);
  const unlocked = s.kitchen.unlockedRecipes.includes(recipe.id);
  const onMenu = s.kitchen.menu.includes(recipe.id);

  if (!unlocked) {
    return (
      <div className="border-2 border-[#3a2d1e] bg-[#171008] p-2 text-xs text-[#5b4d3a]">
        <div className="font-bold">
          🔒 {recipe.name}（{CATEGORY_LABEL[recipe.category]}）
        </div>
        <div className="mt-1 text-[11px]">{unlockText(recipe)}</div>
      </div>
    );
  }

  const afford = Object.entries(recipe.cost.materials).every(
    ([mid, need]) => (s.inventory[mid] ?? 0) >= (need ?? 0),
  );
  const attract = recipe.attraction.classIds.map((c) => CLASSES[c].name).join('、');

  return (
    <div
      className={`border-2 p-2 text-xs ${
        onMenu ? 'border-[#4a6b2f] bg-[#1d2415]' : 'border-[#3a2d1e] bg-[#1f1812]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-bold">
          {recipe.icon} {recipe.name}
          <span className="ml-1 text-[10px] font-normal text-[#a89880]">{CATEGORY_LABEL[recipe.category]}</span>
        </span>
        {onMenu ? <span className="text-[10px] text-[#a5d47a]">在菜单</span> : null}
      </div>
      {recipe.desc ? (
        <div className="mt-1 text-[10px] italic leading-relaxed text-[#8a7a62]">"{recipe.desc}"</div>
      ) : null}
      <div className="mt-1.5 space-y-0.5 text-[11px] text-[#a89880]">
        <div>
          每小时供料：{afford ? '' : '（当前缺料）'}
          {Object.entries(recipe.cost.materials).map(([mid, need]) => (
            <span key={mid}>
              {' '}
              {MATERIALS[mid]?.icon}
              {MATERIALS[mid]?.name}×{need}
            </span>
          ))}
        </div>
        <div>效果：{recipe.buff.label}（供给期间持续生效）</div>
        <div>吸引：{attract}</div>
      </div>
    </div>
  );
}
