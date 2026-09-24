import { CLASS_SPRITES } from '../data/sprites';
import { CLASSES } from '../data/classes';
import type { ClassId } from '../engine/types';

/** 职业像素图标（Kenney Tiny Creatures，无映射时回退 emoji） */
export function CharacterSprite({ classId, size = 20 }: { classId: ClassId; size?: number }) {
  const file = CLASS_SPRITES[classId];
  if (file) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}sprites/classes/${file}`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="pixel-img"
      />
    );
  }
  return <span className="text-lg leading-none">{CLASSES[classId]?.icon ?? '🧑'}</span>;
}
