import type { ReactNode } from 'react';

interface PanelProps {
  title: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** DOM 锚点 id（酒馆地图房间跳转定位用） */
  id?: string;
}

/** 通用像素风面板容器 */
export function Panel({ title, icon, children, className = '', id }: PanelProps) {
  return (
    <section id={id} className={`pixel-panel p-3 ${className}`}>
      <header className="mb-3 flex items-center gap-2 border-b-2 border-[#5c4325] pb-2">
        {icon ? <span className="text-lg leading-none">{icon}</span> : null}
        <h2 className="text-sm font-bold tracking-wide text-[#d9a441]">{title}</h2>
      </header>
      {children}
    </section>
  );
}
