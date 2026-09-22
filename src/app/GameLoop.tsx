import { useEffect } from 'react';
import { BALANCE } from '../data/balance';
import { useGameStore } from '../store/gameStore';

const DIRECT_TICK_MAX_GAP_S = 60; // 超过 60s 空白走离线补算（效率折算 + 欢迎回来弹窗）

/**
 * 游戏心跳：rAF 驱动，按墙上时钟差值结算固定 1s 步长。
 * 页面隐藏时 rAF 暂停；恢复时大 gap 自动走 catchUp（离线路径），
 * 因此「切页签半小时」和「关页面半小时」的结算逻辑完全一致。
 */
export function GameLoop(): null {
  useEffect(() => {
    let raf = 0;
    let lastWall = Date.now();

    const frame = () => {
      const now = Date.now();
      const gapS = Math.floor((now - lastWall) / 1000);
      if (gapS >= 1) {
        if (gapS > DIRECT_TICK_MAX_GAP_S) {
          useGameStore.getState().catchUp(gapS);
          lastWall = now;
        } else {
          useGameStore.getState().tick(gapS);
          lastWall += gapS * 1000;
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const onVisibility = () => {
      // 隐藏时立即存档；恢复时 rAF 自然继续，gap 逻辑统一处理补算
      if (document.hidden) useGameStore.getState().saveNow();
    };
    const onBeforeUnload = () => useGameStore.getState().saveNow();
    const autosaveTimer = window.setInterval(
      () => useGameStore.getState().saveNow(),
      BALANCE.AUTOSAVE_INTERVAL_S * 1000,
    );

    raf = requestAnimationFrame(frame);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(autosaveTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return null;
}
