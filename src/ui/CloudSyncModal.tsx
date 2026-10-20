import { useCloudStore } from '../store/cloudStore';
import { fmtDateTime } from '../utils/format';

/**
 * 云存档冲突弹窗：本机和云端都有新进度时出现，由玩家自己决定保留哪一份。
 * 任何按钮都会先落定「谁是主副本」，不做静默覆盖。
 */
export function CloudSyncModal() {
  const conflict = useCloudStore((s) => s.conflict);
  const takeCloud = useCloudStore((s) => s.takeCloud);
  const overwriteCloud = useCloudStore((s) => s.overwriteCloud);
  const dismiss = useCloudStore((s) => s.dismissConflict);

  if (!conflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="pixel-panel w-full max-w-md p-4">
        <h2 className="mb-2 text-center text-base font-bold text-[#d9a441]">☁️ 发现两份存档</h2>
        <p className="mb-3 text-center text-xs leading-relaxed text-[#a89880]">
          本机和云端都有你最近的进度，请选择保留哪一份。
          <br />
          未选中的那份会被覆盖，建议先去顶栏「导出存档」备份。
        </p>

        <div className="space-y-2 text-xs">
          <div className="border-2 border-[#8a6a2a] bg-[#2b2118] p-2">
            <div className="font-bold text-[#f0d78c]">💾 本机存档</div>
            <div className="text-[11px] text-[#a89880]">
              最后保存：{conflict.localSavedAt ? fmtDateTime(conflict.localSavedAt) : '未知'}
            </div>
          </div>
          <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2">
            <div className="font-bold text-[#e8c07d]">☁️ 云端存档（版本 {conflict.remoteRev}）</div>
            <div className="text-[11px] text-[#a89880]">
              最后保存：{conflict.remoteSavedAt ? fmtDateTime(conflict.remoteSavedAt) : '未知'}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button type="button" className="pixel-btn pixel-btn-primary w-full" onClick={() => void takeCloud()}>
            ☁️ 使用云端存档（覆盖本机）
          </button>
          <button type="button" className="pixel-btn w-full" onClick={() => void overwriteCloud()}>
            💾 使用本机存档（覆盖云端）
          </button>
          <button type="button" className="pixel-btn w-full" onClick={dismiss}>
            稍后决定
          </button>
        </div>
      </div>
    </div>
  );
}
