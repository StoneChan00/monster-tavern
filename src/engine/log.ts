import { BALANCE } from '../data/balance';
import type { EngineEvent, GameState, LogKind } from './types';

/**
 * 追加日志（环形缓冲，超出裁剪最旧）。
 * 时间戳取 meta.now（模拟时钟）——离线快进时日志时间线与事件一致。
 */
export function pushLog(state: GameState, kind: LogKind, text: string): void {
  state.log.push({ id: state.meta.nextUid++, time: state.meta.now, kind, text });
  if (state.log.length > BALANCE.LOG_LIMIT) {
    state.log.splice(0, state.log.length - BALANCE.LOG_LIMIT);
  }
}

/**
 * 追加结构化战斗事件（环形缓冲）。
 * BattleViewport 按 id 水位线增量消费做动画回放；瞬态字段，存档时剥离。
 */
export function pushEvent<E extends EngineEvent>(state: GameState, event: E): void {
  state.events.push({ ...event, id: state.meta.nextUid++, time: state.meta.now });
  if (state.events.length > BALANCE.EVENT_LIMIT) {
    state.events.splice(0, state.events.length - BALANCE.EVENT_LIMIT);
  }
}
