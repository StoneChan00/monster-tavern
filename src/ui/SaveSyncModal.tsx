import { useEffect, useRef, type ChangeEvent } from 'react';
import { useCloudStore } from '../store/cloudStore';
import { useGameStore } from '../store/gameStore';
import { fmtDateTime } from '../utils/format';

function cloudStatusText(status: ReturnType<typeof useCloudStore.getState>['status']): string {
  switch (status) {
    case 'disabled':
      return '云同步未启用';
    case 'signed-out':
      return '未登录，存档仅保存在本浏览器';
    case 'syncing':
      return '正在与云端同步…';
    case 'synced':
      return '已与云端同步';
    case 'conflict':
      return '检测到冲突，请先选择保留哪一份存档';
    case 'error':
      return '同步异常，进度仍保存在本地';
    case 'idle':
      return '已登录，等待下一次自动同步';
    default:
      return '';
  }
}

/**
 * 顶栏「同步状态」弹窗：集中收纳云同步与本机存档操作。
 * 顶栏只保留用户、同步状态和退出，避免存档操作挤占 Header。
 */
export function SaveSyncModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useCloudStore((s) => s.status);
  const user = useCloudStore((s) => s.user);
  const lastSyncAt = useCloudStore((s) => s.lastSyncAt);
  const message = useCloudStore((s) => s.message);
  const signIn = useCloudStore((s) => s.signIn);
  const uploadLocal = useCloudStore((s) => s.uploadLocal);
  const downloadCloud = useCloudStore((s) => s.downloadCloud);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const cloudConfigured = status !== 'disabled';
  const busy = status === 'syncing';

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

  const onImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = useGameStore.getState().importSaveString(text);
    if (!result.ok) {
      window.alert(`导入失败：${result.message}`);
    } else {
      onClose();
    }
    event.target.value = '';
  };

  const onReset = () => {
    if (window.confirm('确定要清空全部进度吗？此操作不可恢复！建议先导出存档备份。')) {
      useGameStore.getState().hardReset();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-sync-title"
        className="pixel-panel flex max-h-[calc(100vh-2rem)] w-full max-w-lg flex-col p-4"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="save-sync-title" className="text-base font-bold text-[#d9a441]">
              💾 存档与同步
            </h2>
            <p className="mt-1 text-[11px] text-[#a89880]">本机存档是主副本，云端是跨设备备份。</p>
          </div>
          <button type="button" className="pixel-btn shrink-0" onClick={onClose} aria-label="关闭存档弹窗">
            ✕
          </button>
        </div>

        <div className="min-h-0 space-y-3 overflow-y-auto pr-0.5">
          <section className="border-2 border-[#3a2d1e] bg-[#1f1812] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-[#f0d78c]">☁️ 云端同步</h3>
              <span
                className={`border-2 px-1 text-[10px] leading-4 font-bold ${
                  status === 'conflict' || status === 'error'
                    ? 'border-[#8a3a2a] text-[#e08a72]'
                    : status === 'syncing'
                      ? 'border-[#8a6a2a] text-[#d9a441]'
                      : 'border-[#4a6b2f] text-[#a5d47a]'
                }`}
              >
                {cloudStatusText(status)}
              </span>
            </div>

            {user ? (
              <div className="mb-2 flex items-center gap-2 text-xs text-[#f0e6d2]">
                {user.photo ? (
                  <img
                    src={user.photo}
                    alt=""
                    className="h-6 w-6 border-2 border-[#5c4325]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span aria-hidden="true">👤</span>
                )}
                <span className="min-w-0 flex-1 truncate">{user.name}</span>
                <span className="text-[10px] text-[#8a7a62]">
                  {lastSyncAt ? `上次同步 ${fmtDateTime(lastSyncAt)}` : '尚未同步'}
                </span>
              </div>
            ) : cloudConfigured ? (
              <p className="mb-2 text-[11px] leading-relaxed text-[#a89880]">
                登录后可把本机进度备份到云端。不登录也能完整游玩。
              </p>
            ) : (
              <p className="mb-2 text-[11px] leading-relaxed text-[#a89880]">
                当前部署未启用云同步，进度仅保存在本浏览器。
              </p>
            )}

            {message ? (
              <p
                className={`mb-2 border-l-2 px-2 py-1 text-[10px] leading-relaxed ${
                  status === 'error' || status === 'conflict'
                    ? 'border-[#8a3a2a] text-[#e08a72]'
                    : 'border-[#5c4325] text-[#a89880]'
                }`}
              >
                {message}
              </p>
            ) : null}

            {cloudConfigured && !user ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={() => void signIn('google')}
                  title="用 Google 账号登录，存档可跨设备同步"
                >
                  ☁️ Google 登录
                </button>
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={() => void signIn('github')}
                  title="用 GitHub 账号登录。注意：同一邮箱用不同登录方式会是两份独立存档"
                >
                  🐙 GitHub 登录
                </button>
              </div>
            ) : null}

            {cloudConfigured ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="pixel-btn"
                  disabled={!user || busy}
                  onClick={() => void uploadLocal()}
                  title={user ? '把本机存档上传到云端（会覆盖云端存档）' : '登录后可上传'}
                >
                  ⏫ 上传本机存档
                </button>
                <button
                  type="button"
                  className="pixel-btn"
                  disabled={!user || busy}
                  onClick={() => void downloadCloud()}
                  title={user ? '用云端存档覆盖本机（会丢本机进度）' : '登录后可下载'}
                >
                  ⏬ 下载云端存档
                </button>
              </div>
            ) : null}
          </section>

          <section className="border-2 border-[#3a2d1e] bg-[#1f1812] p-3">
            <h3 className="mb-2 text-xs font-bold text-[#f0d78c]">💾 本机存档</h3>
            <p className="mb-2 text-[10px] leading-relaxed text-[#8a7a62]">
              导出 JSON 作为手动备份；导入会覆盖当前进度；重置会清空全部进度。
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button type="button" className="pixel-btn" onClick={onExport}>
                📤 导出
              </button>
              <button type="button" className="pixel-btn" onClick={() => fileRef.current?.click()}>
                📥 导入
              </button>
              <button type="button" className="pixel-btn pixel-btn-danger" onClick={onReset}>
                🗑 重置
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={onImportFile}
            />
          </section>
        </div>

        <button type="button" className="pixel-btn pixel-btn-primary mt-3 w-full" onClick={onClose}>
          关闭
        </button>
      </div>
    </div>
  );
}
