const TABS = [
  { id: 'dungeon', label: '地牢', icon: '⚔️' },
  { id: 'party', label: '冒险者', icon: '🧑‍🤝‍🧑' },
  { id: 'kitchen', label: '厨房', icon: '🍳' },
  { id: 'tavern', label: '酒馆', icon: '🍺' },
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
          {t.icon} {t.label}
        </button>
      ))}
    </nav>
  );
}
