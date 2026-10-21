import { useCloudStore } from '../store/cloudStore';
import { fmtDateTime } from '../utils/format';

/** 云同步状态文案 */
function statusText(status: ReturnType<typeof useCloudStore.getState>['status'], lastSyncAt: number | null): string {
  switch (status) {
    case 'disabled':
      return '本地存档';
    case 'signed-out':
      return '仅本地';
    case 'syncing':
      return '同步中…';
    case 'synced':
      return lastSyncAt ? `已同步 ${fmtDateTime(lastSyncAt)}` : '已同步';
    case 'conflict':
      return '检测到冲突';
    case 'error':
      return '同步异常';
    case 'idle':
      return '待同步';
    default:
      return '';
  }
}

/**
 * 顶栏云同步入口：只保留用户、同步状态和退出。
 * 上传/下载/导入/导出/重置统一收进「同步状态」弹窗。
 */
export function CloudBar({ onOpenSaveMenu }: { onOpenSaveMenu: () => void }) {
  const status = useCloudStore((s) => s.status);
  const user = useCloudStore((s) => s.user);
  const lastSyncAt = useCloudStore((s) => s.lastSyncAt);
  const message = useCloudStore((s) => s.message);
  const signOutNow = useCloudStore((s) => s.signOutNow);

  const badgeTone =
    status === 'conflict' || status === 'error'
      ? 'border-[#8a3a2a] text-[#e08a72]'
      : status === 'syncing'
        ? 'border-[#8a6a2a] text-[#d9a441]'
        : status === 'disabled' || status === 'signed-out'
          ? 'border-[#5c4325] text-[#a89880]'
          : 'border-[#4a6b2f] text-[#a5d47a]';

  return (
    <span className="flex flex-wrap items-center gap-2">
      {user ? (
        <span className="flex items-center gap-1.5">
          {user.photo ? (
            <img
              src={user.photo}
              alt=""
              className="h-5 w-5 border-2 border-[#5c4325]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span aria-hidden="true">👤</span>
          )}
          <span className="hidden max-w-[110px] truncate text-[11px] text-[#a89880] sm:inline" title={user.name}>
            {user.name}
          </span>
        </span>
      ) : status !== 'disabled' ? (
        <span className="flex items-center gap-1 text-[11px] text-[#a89880]">
          <span aria-hidden="true">👤</span>
          未登录
        </span>
      ) : null}

      <button
        type="button"
        className={`cursor-pointer border-2 px-1 text-[10px] leading-4 font-bold transition-colors hover:bg-[#332818] ${badgeTone}`}
        onClick={onOpenSaveMenu}
        title={message ?? '点击管理云同步、导入导出与重置存档'}
        aria-label={`${statusText(status, lastSyncAt)}，打开存档与同步`}
        aria-haspopup="dialog"
      >
        {statusText(status, lastSyncAt)}
      </button>

      {user ? (
        <button type="button" className="pixel-btn" onClick={() => void signOutNow()} title="退出登录（本机存档保留）">
          退出
        </button>
      ) : null}
    </span>
  );
}
