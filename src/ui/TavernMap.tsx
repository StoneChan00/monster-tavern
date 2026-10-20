import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { fmtDuration, fmtNum } from '../utils/format';

/**
 * 酒馆场景导航：像素场景图 + 热区跳转（星露谷式「点哪儿去哪儿」）。
 * 场景图由 assets/tools/gen-tavern-scene.cjs 生成（32x18 tile = 512x288），
 * 热区坐标按 tile 网格定义（百分比换算），悬停高亮 + 角标 + 信息浮层。
 *
 * 热区 → 行为：
 *   书架(左上墙)→图鉴 · 宿舍(左翼)→宿舍 · 前台(吧台区,仅展示) ·
 *   招待区(中央)→定位到访面板 · 厨房(右翼)→厨房 · 楼梯(底部)→地牢
 */
export function TavernMap({
  onOpenKitchen,
  onOpenDorm,
  onOpenDungeon,
  onOpenCodex,
}: {
  onOpenKitchen: () => void;
  onOpenDorm: () => void;
  onOpenDungeon: () => void;
  onOpenCodex: () => void;
}) {
  const s = useGameStore((st) => st.state);
  const resting = s.dungeon.status === 'resting';
  const visitorCount = s.recruitment.visitors.length;
  const nextIn = Math.max(0, (s.recruitment.nextVisitAt - s.meta.now) / 1000);
  const menuNext = Math.max(0, (s.kitchen.nextMenuCycleAt - s.meta.now) / 1000);
  const menuDishes = s.kitchen.menu.filter((x) => x !== null).length;
  const menuActive = s.kitchen.menuFed.filter(Boolean).length;

  // 招待区：点亮到访面板并滚动定位（同页签下方）
  const goLounge = () => {
    useGameStore.getState().beginRecruitGuide();
    requestAnimationFrame(() => {
      document.getElementById('lounge-visitors')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  /** 热区矩形（tile 网格 32x18）：[col, row, w, h] */
  const hotspots = [
    {
      id: 'codex',
      icon: '📖',
      label: '图鉴书架',
      rect: [1, 0, 4, 3],
      onClick: onOpenCodex,
      sub: '魔物 · 菜谱 · 成就',
    },
    {
      id: 'dorm',
      icon: '🛏️',
      label: '宿舍',
      rect: [1, 3, 6, 7],
      onClick: onOpenDorm,
      sub: `Lv.${s.tavern.dorm} · 团灭休整 -${Math.min(50, s.tavern.dorm * 10)}%`,
      status: resting ? `💤 队伍休整中 ${fmtDuration(s.dungeon.restRemainingS)}` : undefined,
    },
    {
      id: 'front',
      icon: '🛎️',
      label: '前台',
      rect: [10, 0, 8, 4],
      onClick: undefined, // 前台仅展示，不跳转
      sub: `💰 ${fmtNum(s.player.gold)} · ⭐ ${s.player.reputation} 声望`,
      status: `🧑‍🤝‍🧑 在册 ${s.roster.length} 人`,
    },
    {
      id: 'lounge',
      icon: '🪑',
      label: '招待区',
      rect: [8, 6, 13, 7],
      onClick: goLounge,
      sub: `Lv.${s.tavern.lounge} · 替补席 ${4 + s.tavern.lounge} 人`,
      status:
        visitorCount > 0
          ? `🍻 ${visitorCount} 位冒险者用餐中`
          : `暂无客人 · 下批 ${fmtDuration(nextIn)} 后到访`,
    },
    {
      id: 'kitchen',
      icon: '🍳',
      label: '厨房',
      rect: [22, 0, 10, 13],
      onClick: onOpenKitchen,
      sub: `Lv.${s.tavern.kitchen} · 菜单 ${menuDishes} 道 · 供给中 ${menuActive}`,
      status: menuDishes > 0 ? `⏱ 下次供料 ${fmtDuration(menuNext)}` : '菜单空置——设置菜品获得增益',
    },
    {
      id: 'dungeon',
      icon: '⚔️',
      label: '地牢入口',
      rect: [12, 13, 7, 5],
      onClick: onOpenDungeon,
      sub: '组队下地牢 · 刷怪夺宝',
    },
  ] as const;

  return (
    <Panel
      icon="🍺"
      title={
        <span className="flex flex-wrap items-baseline gap-x-2">
          魔物酒馆
          <span className="text-[10px] font-normal text-[#a89880]">
            点击场景中的区域前往：书架 / 宿舍 / 招待区 / 厨房 / 地牢楼梯
          </span>
        </span>
      }
    >
      <div className="relative select-none overflow-hidden border-2 border-[#5c4325] bg-[#1f1812]">
        <img
          src={`${import.meta.env.BASE_URL}sprites/tavern/tavern-interior.png`}
          alt="酒馆内景：前台、招待区、厨房、宿舍与地牢入口"
          draggable={false}
          className="pixel-img block w-full"
        />
        {hotspots.map((hs) => {
          const [c, r, w, h] = hs.rect;
          const clickable = hs.onClick !== undefined;
          const style = {
            left: `${(c / 32) * 100}%`,
            top: `${(r / 18) * 100}%`,
            width: `${(w / 32) * 100}%`,
            height: `${(h / 18) * 100}%`,
          };
          const inner = (
            <>
              {/* 悬停高亮层 */}
              <span
                className={`absolute inset-0 border-2 transition-colors ${
                  clickable
                    ? 'border-[#d9a441]/0 bg-[#d9a441]/0 group-hover:border-[#d9a441] group-hover:bg-[#d9a441]/30'
                    : 'border-[#a89880]/0 bg-[#a89880]/0 group-hover:border-[#a89880]/60 group-hover:bg-[#a89880]/15'
                }`}
              />
              {/* 区域角标（常显） */}
              <span className="absolute left-0.5 top-0.5 border border-[#5c4325] bg-[#1a1410]/85 px-1 text-[10px] leading-4 font-bold text-[#f0e6d2]">
                {hs.icon} {hs.label}
              </span>
              {/* 悬停信息浮层 */}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 flex-col items-center whitespace-nowrap border border-[#5c4325] bg-[#1a1410]/95 px-2 py-1 text-center group-hover:flex">
                <span className="text-[10px] font-bold text-[#d9a441]">
                  {hs.icon} {hs.label}
                </span>
                <span className="text-[10px] text-[#a89880]">{hs.sub}</span>
                {'status' in hs && hs.status ? <span className="text-[10px] text-[#8a7a62]">{hs.status}</span> : null}
                {clickable ? <span className="text-[10px] text-[#d9a441]">进入 ▸</span> : null}
              </span>
            </>
          );
          return clickable ? (
            <button
              key={hs.id}
              type="button"
              onClick={hs.onClick}
              style={style}
              className="group absolute cursor-pointer"
              aria-label={`${hs.label}：${hs.sub}`}
            >
              {inner}
            </button>
          ) : (
            <div key={hs.id} style={style} className="group absolute cursor-help">
              {inner}
            </div>
          );
        })}
      </div>
      {/* 酒馆外景（装饰） */}
      <div className="mt-3 text-center">
        <img
          src={`${import.meta.env.BASE_URL}sprites/tavern/tavern-exterior.png`}
          alt="酒馆外景"
          draggable={false}
          className="pixel-img w-64"
        />
      </div>
    </Panel>
  );
}
