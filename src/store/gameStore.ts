import { create } from 'zustand';
import { BALANCE } from '../data/balance';
import { RECIPES } from '../data/recipes';
import { TRAINING_GROUND } from '../data/upgrades';
import { MATERIALS } from '../data/materials';
import { applyOffline } from '../engine/offline';
import { tick as engineTick } from '../engine/tick';
import { createInitialState } from '../engine/initialState';
import { pushLog } from '../engine/log';
import { deserialize, serialize } from '../save/migrate';
import { localStorageAdapter, SAVE_KEY } from '../save/adapter';
import type { GameState, OfflineReport, RecipeId } from '../engine/types';

export interface ActionResult {
  ok: boolean;
  message: string;
}

interface GameStore {
  state: GameState;
  offlineReport: OfflineReport | null;
  clockWarning: boolean;
  /** 常规推进（在线，每 1~60s） */
  tick: (seconds: number) => void;
  /** 长空白补算（切页签返回/离线登录），走离线效率折算 */
  catchUp: (gapSeconds: number) => void;
  cook: (recipeId: RecipeId) => ActionResult;
  upgradeTrainingGround: () => ActionResult;
  dismissOfflineReport: () => void;
  saveNow: () => void;
  exportSaveString: () => string;
  importSaveString: (raw: string) => ActionResult;
  hardReset: () => void;
}

let initialized = false;

/**
 * 应用启动时调用一次（main.tsx）：读档 → 迁移 → 离线结算。
 * 存档损坏时备份原档并重开新档。
 */
export function initStore(): void {
  if (initialized) return;
  initialized = true;

  let state: GameState | null = null;
  const raw = localStorageAdapter.load();
  if (raw) {
    state = deserialize(raw);
    if (!state) {
      try {
        localStorage.setItem(`${SAVE_KEY}:corrupt-backup`, raw);
      } catch {
        /* 备份失败不阻塞 */
      }
      state = createInitialState();
      pushLog(state, 'system', '⚠️ 检测到损坏的存档（已自动备份），开启了新的一档。');
    }
  }
  if (!state) state = createInitialState();

  const awaySeconds = (Date.now() - state.meta.lastSavedAt) / 1000;
  const result = applyOffline(state, awaySeconds);
  const showReport = result.report !== null && awaySeconds > BALANCE.WELCOME_BACK_THRESHOLD_S;

  if (result.clockTampered) {
    pushLog(state, 'system', '⚠️ 检测到系统时间回拨，本次离线收益不予结算。');
  }

  useGameStore.setState({
    state,
    offlineReport: showReport ? result.report : null,
    clockWarning: result.clockTampered,
  });
}

export const useGameStore = create<GameStore>()((set, get) => ({
  // 占位初始值；initStore() 在 React 挂载前覆盖
  state: createInitialState(),
  offlineReport: null,
  clockWarning: false,

  tick: (seconds) => {
    if (seconds <= 0) return;
    const s = get().state;
    engineTick(s, seconds);
    set({ state: { ...s } });
  },

  catchUp: (gapSeconds) => {
    const s = get().state;
    const result = applyOffline(s, gapSeconds);
    set({
      state: { ...s },
      offlineReport:
        result.report && gapSeconds > BALANCE.WELCOME_BACK_THRESHOLD_S ? result.report : null,
      clockWarning: result.clockTampered || get().clockWarning,
    });
  },

  cook: (recipeId) => {
    const s = get().state;
    const recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, message: '未知菜谱' };
    if (s.kitchen.job) return { ok: false, message: '厨房正忙（Phase 0 只有一个灶）' };
    if (!s.kitchen.unlockedRecipes.includes(recipeId)) return { ok: false, message: '菜谱尚未解锁' };
    if (s.player.gold < recipe.cost.gold) return { ok: false, message: '金币不足' };
    for (const [mid, need] of Object.entries(recipe.cost.materials)) {
      if ((s.inventory[mid] ?? 0) < (need ?? 0)) {
        return {
          ok: false,
          message: `${MATERIALS[mid]?.name ?? mid} 不足（还需 ${(need ?? 0) - (s.inventory[mid] ?? 0)}）`,
        };
      }
    }
    s.player.gold -= recipe.cost.gold;
    for (const [mid, need] of Object.entries(recipe.cost.materials)) {
      s.inventory[mid] = (s.inventory[mid] ?? 0) - (need ?? 0);
    }
    s.kitchen.job = { recipeId, remainingS: recipe.cookTimeS, totalS: recipe.cookTimeS };
    pushLog(s, 'kitchen', `🔥 开始烹饪「${recipe.name}」（约 ${Math.ceil(recipe.cookTimeS / 60)} 分钟）`);
    set({ state: { ...s } });
    return { ok: true, message: '开始烹饪' };
  },

  upgradeTrainingGround: () => {
    const s = get().state;
    const lv = s.tavern.trainingGround;
    if (lv >= TRAINING_GROUND.maxLevel) return { ok: false, message: '已满级' };
    const cost = TRAINING_GROUND.cost(lv);
    if (s.player.gold < cost.gold) return { ok: false, message: '金币不足' };
    for (const [mid, need] of Object.entries(cost.materials)) {
      if ((s.inventory[mid] ?? 0) < (need ?? 0)) {
        return {
          ok: false,
          message: `${MATERIALS[mid]?.name ?? mid} 不足（还需 ${(need ?? 0) - (s.inventory[mid] ?? 0)}）`,
        };
      }
    }
    s.player.gold -= cost.gold;
    for (const [mid, need] of Object.entries(cost.materials)) {
      s.inventory[mid] = (s.inventory[mid] ?? 0) - (need ?? 0);
    }
    s.tavern.trainingGround += 1;
    pushLog(
      s,
      'tavern',
      `🏗️ ${TRAINING_GROUND.name} 升到 Lv.${lv + 1}：${TRAINING_GROUND.describe(lv + 1)}`,
    );
    set({ state: { ...s } });
    return { ok: true, message: '升级成功' };
  },

  dismissOfflineReport: () => set({ offlineReport: null, clockWarning: false }),

  saveNow: () => {
    const s = get().state;
    s.meta.lastSavedAt = Date.now();
    try {
      localStorageAdapter.save(serialize(s));
    } catch {
      // 配额满等异常：静默失败。UI 的「导出存档」按钮是玩家的兜底手段
    }
  },

  exportSaveString: () => serialize(get().state),

  importSaveString: (raw) => {
    const state = deserialize(raw);
    if (!state) return { ok: false, message: '存档文件无效' };
    state.meta.lastSavedAt = Date.now();
    pushLog(state, 'system', '📥 存档已导入。');
    set({ state, offlineReport: null, clockWarning: false });
    return { ok: true, message: '导入成功' };
  },

  hardReset: () => {
    localStorageAdapter.clear();
    const state = createInitialState();
    set({ state, offlineReport: null, clockWarning: false });
  },
}));
