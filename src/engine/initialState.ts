import { BALANCE } from '../data/balance';
import { STARTER_ADVENTURER } from '../data/classes';
import { FLOOR_DEFS } from '../data/monsters';
import { initialUnlockedRecipes } from '../data/recipes';
import { spawnWave } from './combat';
import { getAdventurerStats } from './stats';
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
      now,
      nextUid: 1,
      lifetimeGoldEarned: 0,
      lifetimeExpEarned: 0,
      totalWavesCleared: 0,
      totalBossKills: 0,
      floorsFirstCleared: [],
    },
    player: { gold: 60, reputation: 0 },
    roster: [
      {
        ...STARTER_ADVENTURER,
        level: 1,
        exp: 0,
        hp: 1, // 占位，下面按满血初始化
        loyalty: 50,
      },
    ],
    party: [STARTER_ADVENTURER.id, null, null, null, null],
    recruitment: {
      visitors: [],
      // 3 分钟后首批到访：让新玩家尽快面对「签约」这个第一决策
      nextVisitAt: now + 180_000,
      lastWageDay: Math.floor(now / BALANCE.DAY_MS),
    },
    inventory: {},
    kitchen: {
      job: null,
      unlockedRecipes: initialUnlockedRecipes(),
      buffs: [],
    },
    tavern: { trainingGround: 0, lounge: 0, kitchen: 0, dorm: 0, intel: 0 },
    dungeon: {
      floorId: FLOOR_DEFS[0].id,
      waveIndex: 0,
      status: 'combat',
      restRemainingS: 0,
      monsters: [],
      highestFloor: 1,
      farmFloor: 1,
    },
    log: [],
  };
  const hank = state.roster[0];
  hank.hp = getAdventurerStats(state, hank).hp;
  spawnWave(state);
  pushLog(state, 'system', `🍺 ${STARTER_ADVENTURER.name} 在酒馆签下契约，向 ${FLOOR_DEFS[0].name} 进发！`);
  pushLog(state, 'system', '🍽️ 飘香的饭菜会吸引冒险者到访——记得解锁菜谱、升级厨房！');
  return state;
}
