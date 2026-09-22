interface BarProps {
  value: number;
  max: number;
  /** 进度条填充色（hex） */
  color: string;
  label?: string;
  height?: string;
}

/** 块状进度条（像素风：硬边框 + 纯色填充） */
export function Bar({ value, max, color, label, height = 'h-4' }: BarProps) {
  const ratio = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  return (
    <div className="relative w-full border-2 border-[#171008] bg-[#171008]">
      <div
        className={`${height} transition-[width] duration-500 ease-out`}
        style={{ width: `${ratio * 100}%`, backgroundColor: color }}
      />
      {label ? (
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-[#f0e6d2] [text-shadow:1px_1px_0_rgba(0,0,0,0.9)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
