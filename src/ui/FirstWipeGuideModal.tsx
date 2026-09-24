import { useGameStore } from '../store/gameStore';
import { BALANCE } from '../data/balance';
import { MATERIALS } from '../data/materials';

/**
 * 首次团灭应急资助引导弹窗（一次性）：
 * 引擎发放资助的瞬间由 store 捕捉跃迁打开；「去招募」跳转冒险者页签并点亮招募面板。
 */
export function FirstWipeGuideModal({ onGoRecruit }: { onGoRecruit: () => void }) {
  const open = useGameStore((st) => st.firstWipeGuideOpen);
  const rosterCount = useGameStore((st) => st.state.roster.length);
  const dismiss = useGameStore((st) => st.dismissFirstWipeGuide);
  const beginGuide = useGameStore((st) => st.beginRecruitGuide);

  if (!open) return null;

  const matParts = Object.entries(BALANCE.WIPE_SUBSIDY_MATERIALS)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([mid, n]) => `${MATERIALS[mid]?.icon ?? '📦'}${MATERIALS[mid]?.name ?? mid}×${n}`);
  const firstMember = rosterCount <= 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="pixel-panel w-full max-w-md p-4">
        <h2 className="mb-3 text-center text-base font-bold text-[#d9a441]">
          💔 队伍全灭……但酒馆的灯还亮着
        </h2>
        <p className="mb-3 text-center text-xs leading-relaxed text-[#a89880]">
          {firstMember ? '独自闯荡魔物巢穴，实在太勉强了。' : '看来这支队伍还需要更多人手。'}
          幸存的冒险者把消息带回了酒馆——
        </p>
        <div className="space-y-1 border-2 border-[#8a6a2a] bg-[#2b2118] p-3 text-center text-xs">
          <div className="font-bold text-[#f0d78c]">🆘 酒馆理事会紧急拨款</div>
          <div className="text-[#f0e6d2]">
            💰 金币 +{BALANCE.WIPE_SUBSIDY_GOLD}
            {matParts.length > 0 ? ` · ${matParts.join(' · ')}` : ''}
          </div>
        </div>
        <p className="mt-3 text-center text-xs leading-relaxed text-[#a89880]">
          {firstMember
            ? '听说这里遇上了麻烦，冒险者们已经赶到酒馆——去招待区签约你的第一位伙伴，组成小队再战吧！'
            : '去酒馆的「招待区」看看，签约新的伙伴壮大队伍吧！'}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          <button
            type="button"
            className="pixel-btn pixel-btn-primary w-full"
            onClick={() => {
              beginGuide();
              dismiss();
              onGoRecruit();
            }}
          >
            ✍️ 去招募伙伴
          </button>
          <button type="button" className="pixel-btn w-full" onClick={dismiss}>
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
}
