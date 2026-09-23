import { useState } from 'react';
import { Panel } from './Panel';
import { CharacterSprite } from './CharacterSprite';
import { useGameStore } from '../store/gameStore';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { MATERIALS } from '../data/materials';
import { levelTier } from '../engine/stats';
import { fmtDuration } from '../utils/format';
import type { Visitor } from '../engine/types';

/** 招募面板：到访者列表 + 签约（D&D 等级制，高等级到访极稀有） */
export function RecruitPanel() {
  const s = useGameStore((st) => st.state);
  const [hints, setHints] = useState<Record<number, string>>({});
  const nextIn = Math.max(0, (s.recruitment.nextVisitAt - s.meta.now) / 1000);
  const visitors = s.recruitment.visitors;

  const onSign = (uid: number) => {
    const r = useGameStore.getState().signVisitor(uid);
    if (!r.ok) setHints((h) => ({ ...h, [uid]: r.message }));
  };

  return (
    <Panel
      title={visitors.length > 0 ? `招募 · ${visitors.length} 位冒险者正在用餐` : `招募 · 下一批 ${fmtDuration(nextIn)} 后到访`}
      icon="🍻"
    >
      {visitors.length === 0 ? (
        <p className="text-xs text-[#a89880]">
          暂无冒险者到访。解锁更多菜谱能吸引特定职业；高等级冒险者（Lv9-10
          传奇）到访屈指可数，声望越高越可能遇见。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {visitors.map((v) => (
            <VisitorCard key={v.uid} visitor={v} hint={hints[v.uid]} onSign={onSign} />
          ))}
        </div>
      )}
    </Panel>
  );
}

function VisitorCard({
  visitor,
  hint,
  onSign,
}: {
  visitor: Visitor;
  hint?: string;
  onSign: (uid: number) => void;
}) {
  const s = useGameStore((st) => st.state);
  const cls = CLASSES[visitor.classId];
  const mat = MATERIALS[visitor.costMaterial.materialId];
  const tier = levelTier(visitor.level);
  const goldOk = s.player.gold >= visitor.costGold;
  const matOk = (s.inventory[visitor.costMaterial.materialId] ?? 0) >= visitor.costMaterial.count;
  const canSign = goldOk && matOk;

  return (
    <div className="border-2 border-[#3a2d1e] bg-[#1f1812] p-2 text-xs">
      <div className="flex items-center gap-1.5">
        <CharacterSprite classId={visitor.classId} size={22} />
        <span className="truncate font-bold" style={{ color: tier.color }}>
          {visitor.name}
        </span>
        <span className="ml-auto text-[10px] text-[#a89880]">
          {RACES[visitor.race]?.name ?? '人类'} · {cls.name} ·{' '}
          <span style={{ color: tier.color }}>
            Lv.{visitor.level} {tier.label}
          </span>
        </span>
      </div>
      <div className="mt-1.5 text-[11px] text-[#a89880]">
        签约费：💰{visitor.costGold}
        {visitor.costMaterial.count > 0 ? ` + ${mat?.icon ?? ''}${mat?.name ?? ''}×${visitor.costMaterial.count}` : ''}
      </div>
      <button
        type="button"
        className="pixel-btn pixel-btn-primary mt-1.5 w-full"
        disabled={!canSign}
        onClick={() => onSign(visitor.uid)}
      >
        {canSign ? '✍️ 签约入伙' : !goldOk ? '金币不足' : '材料不足'}
      </button>
      {hint ? <div className="mt-1 text-[10px] text-[#c0392b]">{hint}</div> : null}
    </div>
  );
}
