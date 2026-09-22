/**
 * 持久层适配器：Phase 0 用 localStorage；
 * 后续可无缝切换 IndexedDB（idb / localForage）而不动上层代码。
 */
export interface SaveAdapter {
  load(): string | null;
  save(raw: string): void;
  clear(): void;
}

export const SAVE_KEY = 'monster-tavern:save';

export const localStorageAdapter: SaveAdapter = {
  load() {
    try {
      return localStorage.getItem(SAVE_KEY);
    } catch {
      return null;
    }
  },
  save(raw) {
    localStorage.setItem(SAVE_KEY, raw);
  },
  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* 忽略 */
    }
  },
};
