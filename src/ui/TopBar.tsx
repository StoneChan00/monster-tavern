import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmtNum } from '../utils/format';
import { GameIcon } from './GameIcon';
import { CloudBar } from './CloudBar';
import { SaveSyncModal } from './SaveSyncModal';

/** 顶栏：酒馆名 + 货币 + 云同步入口 */
export function TopBar() {
  const gold = useGameStore((st) => st.state.player.gold);
  const reputation = useGameStore((st) => st.state.player.reputation);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  return (
    <>
      <header className="pixel-panel flex flex-wrap items-center gap-x-4 gap-y-2 p-2 px-3">
        <h1 className="flex items-center gap-1.5 text-base font-bold text-[#d9a441]">
          <GameIcon sprite="ui/ui_tab_tavern.png" fallback="🍺" size={18} />
          魔物酒馆
        </h1>
        <span className="flex items-center gap-1 text-sm tabular-nums" title="金币">
          <GameIcon sprite="ui/ui_coin.png" fallback="💰" size={16} />
          <span className="font-bold text-[#f0d78c]">{fmtNum(gold)}</span>
        </span>
        <span className="flex items-center gap-1 text-sm tabular-nums" title="声望">
          <GameIcon sprite="ui/ui_reputation.png" fallback="⭐" size={16} />
          <span className="font-bold text-[#e8c07d]">{fmtNum(reputation)}</span>
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-2">
          <CloudBar onOpenSaveMenu={() => setSaveMenuOpen(true)} />
        </span>
      </header>
      <SaveSyncModal open={saveMenuOpen} onClose={() => setSaveMenuOpen(false)} />
    </>
  );
}
