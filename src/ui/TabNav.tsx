import { GameIcon } from './GameIcon';

const TABS = [
  { id: 'dungeon', label: '地牢', icon: '⚔️', sprite: 'ui/ui_tab_dungeon.png' },
  { id: 'dorm', label: '宿舍', icon: '🛏️', sprite: 'ui/ui_tab_dorm.png' },
  { id: 'kitchen', label: '厨房', icon: '🍳', sprite: 'ui/ui_tab_kitchen.png' },
  { id: 'tavern', label: '酒馆', icon: '🍺', sprite: 'ui/ui_tab_tavern.png' },
  { id: 'codex', label: '图鉴', icon: '📖', sprite: 'ui/ui_tab_codex.png' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export function TabNav({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <nav className="flex gap-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`pixel-btn flex-1 ${active === t.id ? 'pixel-btn-primary' : ''}`}
        >
          <GameIcon sprite={t.sprite} fallback={t.icon} size={14} /> {t.label}
        </button>
      ))}
    </nav>
  );
}
