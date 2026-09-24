import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { fmtDuration, fmtNum } from '../utils/format';

/**
 * 酒馆地图：平面图式导航（对应地牢页签的地图选择，酒馆也有自己的地图）。
 * 房间：前台（账台，展示）· 招待区（点击→定位到访冒险者面板）· 厨房（点击→厨房页签）
 *       · 宿舍（点击→宿舍页签名册）。
 * 桌面端布局（3 列，宿舍/厨房为左右翼）：
 *   ┌──────┬──────┬──────┐
 *   │      │ 前台 │      │
 *   │ 宿舍 ├──────┤ 厨房 │
 *   │      │ 招待区│      │
 *   └──────┴──────┴──────┘
 */
export function TavernMap({
  onOpenKitchen,
  onOpenDorm,
}: {
  onOpenKitchen: () => void;
  onOpenDorm: () => void;
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

  return (
    <Panel
      icon="🗺️"
      title={
        <span className="flex flex-wrap items-baseline gap-x-2">
          酒馆地图
          <span className="text-[10px] font-normal text-[#a89880]">
            点击 招待区 / 厨房 / 宿舍 前往对应区域
          </span>
        </span>
      }
    >
      {/* 3px 间隙 = 房间隔墙（容器底色即墙色） */}
      <div className="grid grid-cols-1 gap-[3px] border-2 border-[#5c4325] bg-[#5c4325] p-[3px] md:grid-cols-3">
        <Room
          className="order-3 md:order-none md:row-span-2"
          icon="🛏️"
          name="宿舍"
          clickable
          sub={`Lv.${s.tavern.dorm} · 团灭休整 -${Math.min(50, s.tavern.dorm * 10)}%`}
          status={resting ? `💤 队伍休整中 ${fmtDuration(s.dungeon.restRemainingS)}` : undefined}
          onClick={onOpenDorm}
        />
        <Room
          className="order-1 md:order-none"
          icon="🛎️"
          name="前台"
          sub={`💰 ${fmtNum(s.player.gold)} · ⭐ ${s.player.reputation} 声望`}
          status={`🧑‍🤝‍🧑 在册 ${s.roster.length} 人`}
        />
        <Room
          className="order-4 md:order-none md:row-span-2"
          icon="🍳"
          name="厨房"
          clickable
          sub={`Lv.${s.tavern.kitchen} · 菜单 ${menuDishes} 道 · 供给中 ${menuActive}`}
          status={`${menuDishes > 0 ? `⏱ 每小时供料 · 下次 ${fmtDuration(menuNext)}` : '菜单空置——设置菜品获得增益'}`}
          onClick={onOpenKitchen}
        />
        <Room
          className="order-2 md:order-none md:col-span-2"
          icon="🪑"
          name="招待区"
          clickable
          sub={`Lv.${s.tavern.lounge} · 替补席 ${4 + s.tavern.lounge} 人`}
          status={
            visitorCount > 0
              ? `🍻 ${visitorCount} 位冒险者用餐中`
              : `暂无客人 · 下批 ${fmtDuration(nextIn)} 后到访`
          }
          onClick={goLounge}
        />
      </div>
    </Panel>
  );
}

interface RoomProps {
  /** 布局类（order / span 由外层注入，移动端与桌面端排序不同） */
  className?: string;
  icon: string;
  name: string;
  /** 等级/常驻效果行 */
  sub: string;
  /** 动态状态行（可缺省） */
  status?: string;
  clickable?: boolean;
  onClick?: () => void;
}

/** 单个房间：像素风木地板 + 名称/等级/动态状态；可点击房间带「进入 ▸」与悬停反馈 */
function Room({ className = '', icon, name, sub, status, clickable = false, onClick }: RoomProps) {
  const base = `tavern-plank relative border-2 p-2 text-left ${
    clickable
      ? 'cursor-pointer border-[#8a6a2a] bg-[#2b2118] transition-colors hover:border-[#d9a441] hover:bg-[#332818]'
      : 'border-[#3a2d1e] bg-[#1f1812]'
  }`;
  const inner = (
    <>
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-xs font-bold text-[#f0e6d2]">{name}</span>
        {clickable ? <span className="ml-auto text-[10px] text-[#d9a441]">进入 ▸</span> : null}
      </div>
      <div className="mt-1 text-[10px] text-[#a89880]">{sub}</div>
      {status ? <div className="mt-0.5 text-[10px] text-[#8a7a62]">{status}</div> : null}
    </>
  );

  if (clickable) {
    return (
      <button type="button" onClick={onClick} className={`${base} ${className}`}>
        {inner}
      </button>
    );
  }
  return <div className={`${base} ${className}`}>{inner}</div>;
}
