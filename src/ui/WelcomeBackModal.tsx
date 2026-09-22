import { useGameStore } from '../store/gameStore';
import { MATERIALS } from '../data/materials';
import { fmtDuration, fmtNum } from '../utils/format';

/** 「欢迎回来」离线结算弹窗 / 时钟异常警告 */
export function WelcomeBackModal() {
  const report = useGameStore((st) => st.offlineReport);
  const clockWarning = useGameStore((st) => st.clockWarning);
  const dismiss = useGameStore((st) => st.dismissOfflineReport);

  if (!report && !clockWarning) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="pixel-panel w-full max-w-md p-4">
        {clockWarning ? (
          <>
            <h2 className="mb-2 text-center text-base font-bold text-[#c0392b]">⚠️ 系统时间异常</h2>
            <p className="mb-3 text-center text-xs text-[#a89880]">
              检测到系统时间回拨，本次离线收益不予结算。
              <br />
              请校准系统时间后继续营业。
            </p>
          </>
        ) : null}

        {report ? (
          <>
            <h2 className="mb-3 text-center text-base font-bold text-[#d9a441]">🍻 欢迎回来！</h2>
            <p className="mb-3 text-center text-xs text-[#a89880]">
              你离开了 <span className="font-bold text-[#f0e6d2]">{fmtDuration(report.awaySeconds)}</span>
              ，结算 <span className="font-bold text-[#f0e6d2]">{fmtDuration(report.appliedSeconds)}</span>
              （效率 {Math.round(report.efficiency * 100)}%）
            </p>
            <div className="space-y-1 border-2 border-[#3a2d1e] bg-[#1f1812] p-3 text-xs">
              <Row label="💰 金币" value={`+${fmtNum(report.gold)}`} />
              <Row label="⭐ 经验" value={`+${fmtNum(report.exp)}`} />
              {report.levelsGained > 0 ? (
                <Row label="🎉 升级" value={`+${report.levelsGained} 级`} highlight />
              ) : null}
              <Row label="🌊 清波" value={`+${report.wavesCleared}`} />
              {report.bossKills > 0 ? (
                <Row label="👑 BOSS 击杀" value={`+${report.bossKills}`} highlight />
              ) : null}
              {Object.entries(report.materials).map(([id, n]) => (
                <Row
                  key={id}
                  label={`${MATERIALS[id]?.icon ?? '📦'} ${MATERIALS[id]?.name ?? id}`}
                  value={`+${n}`}
                />
              ))}
            </div>
          </>
        ) : null}

        <button type="button" className="pixel-btn pixel-btn-primary mt-4 w-full" onClick={dismiss}>
          继续营业
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#a89880]">{label}</span>
      <span className={`font-bold tabular-nums ${highlight ? 'text-[#7cb342]' : 'text-[#f0e6d2]'}`}>
        {value}
      </span>
    </div>
  );
}
