import { create } from 'zustand';
import { BALANCE, kitchenSpeedMult, rosterCap } from '../data/balance';
import { CLASSES } from '../data/classes';
import { RACES } from '../data/races';
import { RECIPES } from '../data/recipes';
import { FACILITIES, type FacilityId } from '../data/upgrades';
import { MATERIALS } from '../data/materials';
import { FLOORS, floorIdOf } from '../data/monsters';
import { applyOffline } from '../engine/offline';
import { tick as engineTick } from '../engine/tick';
import { createInitialState } from '../engine/initialState';
import { pushLog } from '../engine/log';
import { getAdventurerStats, RARITY_LABEL } from '../engine/stats';
import { isSlotUnlocked } from '../engine/party';
import { deserialize, serialize } from '../save/migrate';
import { localStorageAdapter, SAVE_KEY } from '../save/adapter';
import type { AdventurerState, GameState, OfflineReport, RecipeId } from '../engine/types';

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
  upgradeFacility: (facilityId: FacilityId) => ActionResult;
  signVisitor: (uid: number) => ActionResult;
  assignToSlot: (slot: number, adventurerId: string | null) => ActionResult;
  setFarmFloor: (floor: number) => ActionResult;
  dismissOfflineReport: () => void;
  saveNow: () => void;
  exportSaveString: () => string;
  importSaveString: (raw: string) => ActionResult;
  hardReset: () => void;
}

let initialized = false;

/**
 * 应用启动时调用一次（main.tsx）：读档 → 迁移 → 离线结算。
 * 存档损坏时备份原档并重开新档；同时申请浏览器持久存储。
 */
export function initStore(): void {
  if (initialized) return;
  initialized = true;

  // 申请持久存储，降低浏览器自动清档的概率（不保证 granting）
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      void navigator.storage.persist().catch(() => undefined);
    }
  } catch {
    /* 忽略 */
  }

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

/** 材料/金币消耗校验（设施升级与烹饪共用） */
function canAfford(
  state: GameState,
  cost: { gold: number; reputation?: number; materials: Partial<Record<string, number>> },
): { ok: true } | { ok: false; message: string } {
  if (cost.gold > 0 && state.player.gold < cost.gold) return { ok: false, message: '金币不足' };
  if (cost.reputation && state.player.reputation < cost.reputation) {
    return { ok: false, message: `声望不足（需 ${cost.reputation}）` };
  }
  for (const [mid, need] of Object.entries(cost.materials)) {
    if ((state.inventory[mid] ?? 0) < (need ?? 0)) {
      const def = MATERIALS[mid];
      return {
        ok: false,
        message: `${def?.name ?? mid} 不足（还需 ${(need ?? 0) - (state.inventory[mid] ?? 0)}）`,
      };
    }
  }
  return { ok: true };
}

function payCost(
  state: GameState,
  cost: { gold: number; reputation?: number; materials: Partial<Record<string, number>> },
): void {
  state.player.gold -= cost.gold;
  if (cost.reputation) state.player.reputation -= cost.reputation;
  for (const [mid, need] of Object.entries(cost.materials)) {
    state.inventory[mid] = (state.inventory[mid] ?? 0) - (need ?? 0);
  }
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
    const pending = get().offlineReport;
    const fresh =
      result.report && gapSeconds > BALANCE.WELCOME_BACK_THRESHOLD_S ? result.report : null;
    set({
      state: { ...s },
      // 关键修复：已有待确认的「欢迎回来」报告时，后续补算不得清空/替换它。
      // 旧逻辑在后台页签 61~120s 的 catchUp 中会把报告置 null，
      // 导致 initStore 刚设置的弹窗"闪一下消失"。
      offlineReport: pending ?? fresh,
      clockWarning: result.clockTampered || get().clockWarning,
    });
  },

  cook: (recipeId) => {
    const s = get().state;
    const recipe = RECIPES[recipeId];
    if (!recipe) return { ok: false, message: '未知菜谱' };
    if (s.kitchen.job) return { ok: false, message: '厨房正忙（一次只能炖一锅）' };
    if (!s.kitchen.unlockedRecipes.includes(recipeId)) return { ok: false, message: '菜谱尚未解锁' };
    const afford = canAfford(s, recipe.cost);
    if (!afford.ok) return { ok: false, message: afford.message };
    payCost(s, recipe.cost);
    const speed = kitchenSpeedMult(s.tavern.kitchen);
    s.kitchen.job = {
      recipeId,
      remainingS: recipe.cookTimeS / speed,
      totalS: recipe.cookTimeS,
    };
    pushLog(s, 'kitchen', `🔥 开始烹饪「${recipe.name}」（约 ${Math.ceil(recipe.cookTimeS / speed / 60)} 分钟）`);
    set({ state: { ...s } });
    return { ok: true, message: '开始烹饪' };
  },

  upgradeFacility: (facilityId) => {
    const s = get().state;
    const def = FACILITIES[facilityId];
    if (!def) return { ok: false, message: '未知设施' };
    const lv = s.tavern[facilityId];
    if (lv >= def.maxLevel) return { ok: false, message: '已满级' };
    const cost = def.cost(lv);
    const afford = canAfford(s, cost);
    if (!afford.ok) return { ok: false, message: afford.message };
    payCost(s, cost);
    s.tavern[facilityId] += 1;
    pushLog(s, 'tavern', `🏗️ ${def.name} 升到 Lv.${lv + 1}：${def.describe(lv + 1)}`);
    set({ state: { ...s } });
    return { ok: true, message: '升级成功' };
  },

  signVisitor: (uid) => {
    const s = get().state;
    const visitor = s.recruitment.visitors.find((v) => v.uid === uid);
    if (!visitor) return { ok: false, message: '该冒险者已离店' };
    if (s.roster.length >= rosterCap(s.tavern.lounge)) {
      return { ok: false, message: '替补席已满（升级招待区扩容）' };
    }
    const mat = MATERIALS[visitor.costMaterial.materialId];
    if (s.player.gold < visitor.costGold) return { ok: false, message: '金币不足' };
    if ((s.inventory[visitor.costMaterial.materialId] ?? 0) < visitor.costMaterial.count) {
      return {
        ok: false,
        message: `${mat?.name ?? visitor.costMaterial.materialId} 不足（还需 ${visitor.costMaterial.count - (s.inventory[visitor.costMaterial.materialId] ?? 0)}）`,
      };
    }
    s.player.gold -= visitor.costGold;
    s.inventory[visitor.costMaterial.materialId] =
      (s.inventory[visitor.costMaterial.materialId] ?? 0) - visitor.costMaterial.count;
    s.recruitment.visitors = s.recruitment.visitors.filter((v) => v.uid !== uid);

    const adv: AdventurerState = {
      id: `adv_${visitor.uid}`,
      name: visitor.name,
      classId: visitor.classId,
      race: visitor.race,
      rarity: visitor.rarity,
      level: 1,
      exp: 0,
      hp: 1,
      loyalty: 50,
    };
    adv.hp = getAdventurerStats(s, adv).hp;
    s.roster.push(adv);

    // 自动编队：首个已解锁的空位
    const slot = s.party.findIndex((id, i) => id === null && isSlotUnlocked(i, s.player.reputation));
    if (slot >= 0) s.party[slot] = adv.id;

    const raceName = RACES[visitor.race]?.name ?? '人类';
    pushLog(
      s,
      'system',
      `✍️ ${visitor.name}（${raceName}·${CLASSES[visitor.classId].name}·${RARITY_LABEL[visitor.rarity]}）签下契约！${slot >= 0 ? '已加入编队' : '在替补席待命'}`,
    );
    set({ state: { ...s } });
    return { ok: true, message: '签约成功' };
  },

  assignToSlot: (slot, adventurerId) => {
    const s = get().state;
    if (slot < 0 || slot >= BALANCE.PARTY_SIZE) return { ok: false, message: '无效槽位' };
    if (!isSlotUnlocked(slot, s.player.reputation)) {
      return { ok: false, message: `槽位未解锁（需声望 ${BALANCE.SLOT_UNLOCK_REP[slot]}）` };
    }
    if (adventurerId === null) {
      s.party[slot] = null;
      set({ state: { ...s } });
      return { ok: true, message: '已下场休息' };
    }
    const adv = s.roster.find((a) => a.id === adventurerId);
    if (!adv) return { ok: false, message: '冒险者不存在' };
    const fromSlot = s.party.indexOf(adventurerId);
    const occupant = s.party[slot];
    if (fromSlot >= 0) s.party[fromSlot] = occupant; // 与原槽位 occupants 互换
    s.party[slot] = adventurerId;
    set({ state: { ...s } });
    return { ok: true, message: '编队已更新' };
  },

  setFarmFloor: (floor) => {
    const s = get().state;
    if (!Number.isInteger(floor) || floor < 1 || floor > s.dungeon.highestFloor) {
      return { ok: false, message: '该层尚未解锁' };
    }
    const floorDef = FLOORS[floorIdOf(floor)];
    s.dungeon.farmFloor = floor;
    s.dungeon.floorId = floorDef.id;
    s.dungeon.waveIndex = 0;
    s.dungeon.monsters = [];
    if (s.dungeon.status !== 'resting') {
      // 切层重开本层；休整中则保留休整进度，恢复后从新层第 1 波开始
      s.dungeon.status = 'waveRest';
      s.dungeon.restRemainingS = 1;
    }
    pushLog(s, 'system', `🗺️ 队伍转场至 ${floorDef.name}`);
    set({ state: { ...s } });
    return { ok: true, message: '已转场' };
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
