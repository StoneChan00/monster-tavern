interface GameIconProps {
  /** 贴图相对路径（public/sprites/ 之下，如 'items/mat_gel.png'） */
  sprite?: string;
  /** 无贴图时的 emoji 回退 */
  fallback: string;
  size?: number;
}

/** 游戏图标（贴图优先，emoji 回退；与 MonsterSprite/CharacterSprite 同范式） */
export function GameIcon({ sprite, fallback, size = 16 }: GameIconProps) {
  if (sprite) {
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
  return <span className="text-base leading-none">{fallback}</span>;
}
