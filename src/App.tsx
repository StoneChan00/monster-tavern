import { useState } from 'react';
import { GameLoop } from './app/GameLoop';
import { TopBar } from './ui/TopBar';
import { TabNav, type TabId } from './ui/TabNav';
import { DungeonPanel } from './ui/DungeonPanel';
import { PartyPanel } from './ui/PartyPanel';
import { KitchenPanel } from './ui/KitchenPanel';
import { FacilitiesPanel } from './ui/FacilitiesPanel';
import { CodexPanel } from './ui/CodexPanel';
import { InventoryBar } from './ui/InventoryBar';
import { WelcomeBackModal } from './ui/WelcomeBackModal';

/** Tab 式主界面：地牢 / 冒险者（编队+招募）/ 厨房 / 酒馆（设施+背包）/ 图鉴（统计+成就+魔物） */
export function App() {
  const [tab, setTab] = useState<TabId>('dungeon');
  return (
    <div className="min-h-screen bg-[#1a1410] p-3 text-[#f0e6d2]">
      <GameLoop />
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3">
        <TopBar />
        <TabNav active={tab} onChange={setTab} />
        <main className="min-h-[62vh]">
          {tab === 'dungeon' && <DungeonPanel />}
          {tab === 'party' && <PartyPanel />}
          {tab === 'kitchen' && <KitchenPanel />}
          {tab === 'tavern' && (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <FacilitiesPanel />
              <div className="flex flex-col gap-3">
                <InventoryBar />
              </div>
            </div>
          )}
          {tab === 'codex' && <CodexPanel />}
        </main>
        <footer className="pb-1 text-center text-[10px] text-[#6b5d48]">
          进度自动保存在本浏览器 · 建议定期导出存档备份 · 魔物酒馆 Phase 1
        </footer>
      </div>
      <WelcomeBackModal />
    </div>
  );
}
