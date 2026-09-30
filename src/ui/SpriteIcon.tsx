import { ELITE_SPRITES, MONSTER_SPRITES } from '../data/sprites';
import type { MonsterId } from '../engine/types';

interface MonsterSpriteProps {
  monsterId: MonsterId;
  /** 精英（原生 BOSS）标记：显示金框加冕变体贴图 */
  elite?: boolean;
  /** 无像素图时的 emoji 回退 */
  fallback: string;
  size?: number;
}

/** 像素魔物图标（Kenney Tiny Creatures，无映射时回退 emoji；精英显示金框加冕变体） */
export function MonsterSprite({ monsterId, elite, fallback, size = 20 }: MonsterSpriteProps) {
  const sprite = (elite && ELITE_SPRITES[monsterId]) || MONSTER_SPRITES[monsterId];
  if (sprite) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}sprites/monsters/${sprite}`}
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
