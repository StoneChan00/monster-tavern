import { GameLoop } from './app/GameLoop';
import { TopBar } from './ui/TopBar';
import { AdventurerCard } from './ui/AdventurerCard';
import { DungeonPanel } from './ui/DungeonPanel';
import { KitchenPanel } from './ui/KitchenPanel';
import { TavernPanel } from './ui/TavernPanel';
import { InventoryBar } from './ui/InventoryBar';
import { WelcomeBackModal } from './ui/WelcomeBackModal';

/**
 * 布局（桌面 3 栏，游戏式一屏；移动端纵向堆叠）：
 * 左：冒险者 + 训练场 + 背包 ｜ 中：地牢 ｜ 右：厨房
 */
export function App() {
  return (
    <div className="min-h-screen bg-[#1a1410] p-3 text-[#f0e6d2] lg:h-screen lg:overflow-hidden">
      <GameLoop />
      <div className="mx-auto flex h-full max-w-[1400px] flex-col gap-3">
        <TopBar />
        <main className="grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[320px_1fr_340px]">
          <div className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
            <AdventurerCard />
            <TavernPanel />
            <InventoryBar />
          </div>
          <div className="min-h-0">
            <DungeonPanel />
          </div>
          <div className="flex flex-col gap-3 lg:min-h-0 lg:overflow-y-auto">
            <KitchenPanel />
          </div>
        </main>
        <footer className="pb-1 text-center text-[10px] text-[#6b5d48]">
          进度自动保存在本浏览器 · 建议定期导出存档备份 · 魔物酒馆 Phase 0
        </footer>
      </div>
      <WelcomeBackModal />
    </div>
  );
}
