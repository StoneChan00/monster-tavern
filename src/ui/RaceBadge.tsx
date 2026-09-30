import { RACES } from '../data/races';
import type { RaceId } from '../engine/types';

/** 种族像素徽章（贴图优先，无贴图回退为空） */
export function RaceBadge({ raceId, size = 12 }: { raceId: RaceId; size?: number }) {
  const sprite = RACES[raceId]?.sprite;
  if (!sprite) return null;
  return (
    <img
      src={`${import.meta.env.BASE_URL}sprites/${sprite}`}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="pixel-img"
    />
  );
}
