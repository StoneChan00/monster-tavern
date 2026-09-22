import { BALANCE } from '../data/balance';
import type { GameState, LogKind } from './types';

/**
 * 追加日志（环形缓冲，超出裁剪最旧）。
 * 这是事件流的雏形：Phase 2 战斗视口将订阅此流做动画回放。
 */
export function pushLog(state: GameState, kind: LogKind, text: string): void {
  state.log.push({ id: state.meta.nextUid++, time: Date.now(), kind, text });
  if (state.log.length > BALANCE.LOG_LIMIT) {
    state.log.splice(0, state.log.length - BALANCE.LOG_LIMIT);
  }
}
