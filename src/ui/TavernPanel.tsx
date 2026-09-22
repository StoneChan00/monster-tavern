import { useState } from 'react';
import { Panel } from './Panel';
import { useGameStore } from '../store/gameStore';
import { TRAINING_GROUND } from '../data/upgrades';
import { MATERIALS } from '../data/materials';

/** 酒馆设施面板（Phase 0：训练场） */
export function TavernPanel() {
  const s = useGameStore((st) => st.state);
  const [hint, setHint] = useState('');
  const lv = s.tavern.trainingGround;
  const maxed = lv >= TRAINING_GROUND.maxLevel;
  const cost = maxed ? null : TRAINING_GROUND.cost(lv);
  const needMat = cost?.materials.mat_carapace ?? 0;
  const haveMat = s.inventory.mat_carapace ?? 0;
  const goldOk = cost ? s.player.gold >= cost.gold : false;
  const matOk = haveMat >= needMat;
  const canUp = !maxed && goldOk && matOk;

  const onUpgrade = () => {
    const r = useGameStore.getState().upgradeTrainingGround();
    setHint(r.ok ? '' : r.message);
  };

  return (
    <Panel
      title={`${TRAINING_GROUND.name} Lv.${lv}`}
      icon={TRAINING_GROUND.icon}
    >
      <div className="space-y-2 text-xs">
        <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-[11px] text-[#a89880]">
          当前效果：{TRAINING_GROUND.describe(lv)}
        </div>

        {maxed ? (
          <div className="text-center text-[11px] font-bold text-[#d9a441]">🏆 已达最高等级</div>
        ) : (
          <>
            <div className="flex justify-between text-[11px] text-[#a89880]">
              <span>
                升级费用：💰{cost!.gold} + {MATERIALS.mat_carapace.icon}
                {MATERIALS.mat_carapace.name}×{needMat}
              </span>
              <span className="tabular-nums">
                （{haveMat}/{needMat}）
              </span>
            </div>
            <button
              type="button"
              className="pixel-btn pixel-btn-primary w-full"
              disabled={!canUp}
              onClick={onUpgrade}
            >
              {canUp ? `升级到 Lv.${lv + 1}` : !goldOk ? '金币不足' : '魔物甲壳不足'}
            </button>
          </>
        )}
        {hint ? <div className="text-[11px] text-[#c0392b]">{hint}</div> : null}
      </div>
    </Panel>
  );
}
