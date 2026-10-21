import { useCloudStore } from '../store/cloudStore';
import { fmtDateTime } from '../utils/format';

/** 云同步状态文案 */
function statusText(status: ReturnType<typeof useCloudStore.getState>['status'], lastSyncAt: number | null): string {
  switch (status) {
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
 * 顶栏云同步入口：未配置 Firebase 时整块不渲染（纯本地版本行为不变）。
 * 登录只是「多一个云端副本」，不登录也能完整游玩。
 */
export function CloudBar() {
  const status = useCloudStore((s) => s.status);
  const user = useCloudStore((s) => s.user);
  const lastSyncAt = useCloudStore((s) => s.lastSyncAt);
  const message = useCloudStore((s) => s.message);
  const signIn = useCloudStore((s) => s.signIn);
  const signOutNow = useCloudStore((s) => s.signOutNow);
  const uploadLocal = useCloudStore((s) => s.uploadLocal);
  const downloadCloud = useCloudStore((s) => s.downloadCloud);

  if (status === 'disabled') return null;

  if (!user) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          className="pixel-btn"
          onClick={() => void signIn()}
          title="用 Google 账号登录，存档可跨设备同步（不登录也能正常游玩）"
        >
          ☁️ Google 登录
        </button>
        {status === 'error' && message ? (
          <span className="max-w-[160px] truncate text-[10px] text-[#c0392b]" title={message}>
            {message}
          </span>
        ) : null}
      </span>
    );
  }

  const badgeTone =
    status === 'conflict' || status === 'error'
      ? 'border-[#8a3a2a] text-[#e08a72]'
      : status === 'syncing'
        ? 'border-[#8a6a2a] text-[#d9a441]'
        : 'border-[#4a6b2f] text-[#a5d47a]';

  return (
    <span className="flex items-center gap-1.5">
      {user.photo ? (
        <img src={user.photo} alt="" className="h-5 w-5 border-2 border-[#5c4325]" referrerPolicy="no-referrer" />
      ) : null}
      <span className="hidden max-w-[110px] truncate text-[11px] text-[#a89880] sm:inline" title={user.name}>
        {user.name}
      </span>
      <span
        className={`border-2 px-1 text-[10px] leading-4 font-bold ${badgeTone}`}
        title={message ?? '云端副本状态，本机存档始终是主副本'}
      >
        {statusText(status, lastSyncAt)}
      </span>
      {message && (status === 'error' || status === 'conflict') ? (
        <span className="max-w-[280px] truncate text-[10px] text-[#c0392b]" title={message}>
          {message}
        </span>
      ) : null}
      <button
        type="button"
        className="pixel-btn"
        onClick={() => void uploadLocal()}
        title="把本机存档上传到云端（会覆盖云端存档）"
      >
        ⏫
      </button>
      <button
        type="button"
        className="pixel-btn"
        onClick={() => void downloadCloud()}
        title="用云端存档覆盖本机（会丢本机进度）"
      >
        ⏬
      </button>
      <button type="button" className="pixel-btn" onClick={() => void signOutNow()} title="退出登录（本机存档保留）">
        退出
      </button>
    </span>
  );
}
