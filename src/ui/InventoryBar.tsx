import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { MATERIALS } from '../data/materials';

/** 材料背包 */
export function InventoryBar() {
  const s = useGameStore((st) => st.state);
  return (
    <Panel title="材料背包" icon="🎒">
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.values(MATERIALS).map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-1.5 border-2 border-[#3a2d1e] bg-[#1f1812] px-2 py-1"
            title={m.desc}
          >
            <span className="text-sm leading-none">{m.icon}</span>
            <span className="text-[#a89880]">{m.name}</span>
            <span className="font-bold tabular-nums">×{s.inventory[m.id] ?? 0}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
