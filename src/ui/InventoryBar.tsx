import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { MATERIALS } from '../data/materials';
import { RECIPES } from '../data/recipes';
import {
  isEliteDrop,
  isFoodMaterial,
  materialSourceText,
  upgradeUsageText,
} from '../data/materialInfo';
import { menuConfig } from '../data/balance';
import type { MaterialId } from '../engine/types';

/** 材料背包：精英掉落绿色标记 + 菜单消耗速率 -X/h + 悬停详情（用途/来源） */
export function InventoryBar() {
  const s = useGameStore((st) => st.state);
  const cfg = menuConfig(s.tavern.kitchen);

  // 菜单每小时消耗速率（按材料汇总）
  const burnRate = new Map<MaterialId, number>();
  for (let i = 0; i < s.kitchen.menu.length && i < cfg.slots; i++) {
    const id = s.kitchen.menu[i];
    if (!id || !s.kitchen.menuFed[i]) continue;
    const r = RECIPES[id];
    if (!r) continue;
    for (const [mid, need] of Object.entries(r.cost.materials)) {
      burnRate.set(mid as MaterialId, (burnRate.get(mid as MaterialId) ?? 0) + (need ?? 0));
    }
  }

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-baseline gap-x-2">
          材料背包
          <span className="text-[10px] font-normal text-[#a89880]">
            绿框 = 精英掉落 · 悬停查看用途与来源
          </span>
        </span>
      }
      icon="🎒"
    >
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.values(MATERIALS).map((m) => {
          const elite = isEliteDrop(m.id);
          const burn = burnRate.get(m.id) ?? 0;
          const usage = upgradeUsageText(m.id);
          const source = materialSourceText(m.id);
          const tips = [
            m.desc,
            isFoodMaterial(m.id) ? '🏷️ 食材（菜谱原料）' : null,
            usage ? `⬆️ 升级材料：${usage}` : null,
            source ? `📍 来源：${source}` : null,
          ]
            .filter(Boolean)
            .join('\n');
          return (
            <div
              key={m.id}
              className={`flex items-center gap-1.5 border-2 px-2 py-1 ${
                elite ? 'border-[#4a6b2f] bg-[#1a2415]' : 'border-[#3a2d1e] bg-[#1f1812]'
              }`}
              title={tips}
            >
              <span className="text-sm leading-none">{m.icon}</span>
              <span className={elite ? 'text-[#a5d47a]' : 'text-[#a89880]'}>{m.name}</span>
              <span className="font-bold tabular-nums">×{s.inventory[m.id] ?? 0}</span>
              {burn > 0 ? (
                <span className="border-2 border-[#8a6a2a] px-1 text-[10px] font-bold tabular-nums text-[#f0b45a]">
                  -{burn}/h
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
