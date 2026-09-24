import { Panel } from './Panel';
import { AdventurerCard } from './AdventurerCard';
import { useGameStore } from '../store/gameStore';

/**
 * 宿舍页签：已招募冒险者名册。
 * 每人标注 队伍中（含排位）/ 休息中；编队管理在「地牢」页签，签约新人在「酒馆」招待区。
 */
export function DormPanel() {
  const s = useGameStore((st) => st.state);
  const partyIds = new Set(s.party.filter((x): x is string => x !== null));
  const inPartyCount = s.roster.filter((a) => partyIds.has(a.id)).length;
  const restingCount = s.roster.length - inPartyCount;
  // 队伍中按槽位序排前，休息中按签约顺序排后
  const roster = [...s.roster].sort((a, b) => {
    const sa = s.party.indexOf(a.id);
    const sb = s.party.indexOf(b.id);
    return (sa < 0 ? 99 : sa) - (sb < 0 ? 99 : sb);
  });

  return (
    <Panel
      title={
        <span className="flex flex-wrap items-baseline gap-x-2">
          宿舍名册
          <span className="text-[10px] font-normal text-[#a89880]">
            ⚔️ 队伍中 {inPartyCount} 人 · 🛏️ 休息中 {restingCount} 人
          </span>
        </span>
      }
      icon="🛏️"
    >
      {s.roster.length === 0 ? (
        <p className="text-xs leading-relaxed text-[#a89880]">
          宿舍空空如也。到「酒馆」页签的招待区看看——也许正有冒险者用餐，等待签约。
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {roster.map((a) => (
              <AdventurerCard key={a.id} adv={a} />
            ))}
          </div>
          <div className="mt-2 text-center text-[10px] text-[#6b5d48]">
            编队出征在「地牢」页签管理 · 队伍中的冒险者会自动下地牢刷怪
          </div>
        </>
      )}
    </Panel>
  );
}
