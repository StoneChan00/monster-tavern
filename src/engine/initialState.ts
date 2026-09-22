import { FLOOR_MOSSY_CAVERN } from '../data/monsters';
import { RECIPES } from '../data/recipes';
import { STARTER_ADVENTURER } from '../data/classes';
import { spawnWave } from './combat';
import { getEffectiveStats } from './stats';
import { pushLog } from './log';
import { SAVE_VERSION } from './types';
import type { GameState } from './types';

/** 新档初始状态 */
export function createInitialState(now: number = Date.now()): GameState {
  const state: GameState = {
    version: SAVE_VERSION,
    meta: {
      createdAt: now,
      lastSavedAt: now,
      nextUid: 1,
      lifetimeGoldEarned: 0,
      lifetimeExpEarned: 0,
      totalWavesCleared: 0,
      totalBossKills: 0,
      bossFirstCleared: false,
    },
    player: { gold: 20, reputation: 0 },
    adventurer: {
      ...STARTER_ADVENTURER,
      level: 1,
      exp: 0,
      hp: 1, // 占位，下面按满血初始化
      loyalty: 50,
    },
    inventory: {},
    kitchen: {
      job: null,
      unlockedRecipes: Object.keys(RECIPES),
      buffs: [],
    },
    tavern: { trainingGround: 0 },
    dungeon: {
      floorId: FLOOR_MOSSY_CAVERN.id,
      waveIndex: 0,
      status: 'combat',
      restRemainingS: 0,
      monsters: [],
    },
    log: [],
  };
  state.adventurer.hp = getEffectiveStats(state).hp;
  spawnWave(state);
  pushLog(state, 'system', `🍺 ${STARTER_ADVENTURER.name} 在酒馆签下契约，向 ${FLOOR_MOSSY_CAVERN.name} 进发！`);
  return state;
}
