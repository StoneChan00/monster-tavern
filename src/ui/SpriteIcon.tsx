import { MONSTER_SPRITES } from '../data/sprites';
import type { MonsterId } from '../engine/types';

interface MonsterSpriteProps {
  monsterId: MonsterId;
  /** 无像素图时的 emoji 回退 */
  fallback: string;
  size?: number;
}

/** 像素魔物图标（Kenney Tiny Creatures，无映射时回退 emoji） */
export function MonsterSprite({ monsterId, fallback, size = 20 }: MonsterSpriteProps) {
  const sprite = MONSTER_SPRITES[monsterId];
  if (sprite) {
    return (
      <img
        src={`/sprites/monsters/${sprite}`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="pixel-img"
      />
    );
  }
  return <span className="text-lg leading-none">{fallback}</span>;
}
