/**
 * 存档事件总线：本地写入成功后广播一次，云同步层订阅后决定何时推送。
 * 刻意做成零依赖的小模块，避免 save/ ↔ store/ ↔ cloud/ 之间出现循环引用。
 */
type Listener = (raw: string) => void;

const listeners = new Set<Listener>();

/** 订阅本地存档写入（返回退订函数） */
export function onLocalSave(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** 本地存档写入成功后调用（gameStore.saveNow） */
export function emitLocalSave(raw: string): void {
  for (const fn of listeners) {
    try {
      fn(raw);
    } catch {
      /* 订阅方异常不影响存档主流程 */
    }
  }
}
