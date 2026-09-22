import { useRef, type ChangeEvent } from 'react';
import { useGameStore } from '../store/gameStore';
import { fmtNum } from '../utils/format';

/** 顶栏：酒馆名 + 货币 + 存档操作 */
export function TopBar() {
  const gold = useGameStore((st) => st.state.player.gold);
  const reputation = useGameStore((st) => st.state.player.reputation);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = () => {
    const raw = useGameStore.getState().exportSaveString();
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monster-tavern-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const r = useGameStore.getState().importSaveString(text);
    if (!r.ok) window.alert(`导入失败：${r.message}`);
    e.target.value = '';
  };

  const onReset = () => {
    if (window.confirm('确定要清空全部进度吗？此操作不可恢复！')) {
      useGameStore.getState().hardReset();
    }
  };

  return (
    <header className="pixel-panel flex flex-wrap items-center gap-x-4 gap-y-2 p-2 px-3">
      <h1 className="text-base font-bold text-[#d9a441]">🍺 魔物酒馆</h1>
      <span className="flex items-center gap-1 text-sm tabular-nums" title="金币">
        💰<span className="font-bold text-[#f0d78c]">{fmtNum(gold)}</span>
      </span>
      <span className="flex items-center gap-1 text-sm tabular-nums" title="声望">
        ⭐<span className="font-bold text-[#e8c07d]">{fmtNum(reputation)}</span>
      </span>
      <span className="ml-auto flex gap-2">
        <button type="button" className="pixel-btn" onClick={onExport}>
          📤 导出存档
        </button>
        <button type="button" className="pixel-btn" onClick={() => fileRef.current?.click()}>
          📥 导入存档
        </button>
        <button type="button" className="pixel-btn pixel-btn-danger" onClick={onReset}>
          🗑 重置
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onImportFile}
        />
      </span>
    </header>
  );
}
