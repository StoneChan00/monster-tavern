import { BALANCE } from '../data/balance';
import { RECIPES } from '../data/recipes';
import { FLOORS } from '../data/monsters';
import { resolveRound, spawnWave } from './combat';
import { getEffectiveStats } from './stats';
import { pushLog } from './log';
import type { GameState, TickOptions } from './types';

/**
 * 推进 seconds 秒模拟（每秒 = 1 tick = 1 战斗回合）。
 * 就地修改并返回 state。离线补算与在线 tick 走完全相同的路径——
 * 这是"离线结果与在线一致"的架构保证。
 */
export function tick(state: GameState, seconds: number, opts: TickOptions = {}): GameState {
  for (let i = 0; i < seconds; i++) tickOnce(state, opts);
  return state;
}

function tickOnce(state: GameState, opts: TickOptions): void {
  const rng = opts.rng ?? Math.random;
  const mult = opts.offline ? BALANCE.OFFLINE_EFFICIENCY : 1;

  // ── 地牢 ─────────────────────────────
  const d = state.dungeon;
  switch (d.status) {
    case 'combat':
      resolveRound(state, rng, mult);
      break;
    case 'waveRest':
    case 'resting': {
      d.restRemainingS -= 1;
      if (d.restRemainingS <= 0) {
        if (d.status === 'resting') {
          state.adventurer.hp = getEffectiveStats(state).hp;
          d.waveIndex = 0;
          pushLog(state, 'system', `🛏️ 休整完毕，${state.adventurer.name} 满血重返地牢！`);
        } else {
          d.waveIndex = (d.waveIndex + 1) % FLOORS[d.floorId].waves.length;
        }
        spawnWave(state);
      }
      break;
    }
  }

  // ── 厨房 ─────────────────────────────
  const job = state.kitchen.job;
  if (job) {
    job.remainingS -= 1;
    if (job.remainingS <= 0) completeCooking(state);
  }

  // ── Buff 过期 ────────────────────────
  if (state.kitchen.buffs.length > 0) {
    for (const b of state.kitchen.buffs) b.remainingS -= 1;
    const expired = state.kitchen.buffs.filter((b) => b.remainingS <= 0);
    if (expired.length > 0) {
      state.kitchen.buffs = state.kitchen.buffs.filter((b) => b.remainingS > 0);
      for (const e of expired) {
        pushLog(state, 'kitchen', `${RECIPES[e.recipeId]?.icon ?? '🍽️'} 「${RECIPES[e.recipeId]?.name ?? '菜肴'}」的效果消散了`);
      }
      // buff 过期后当前 HP 可能超上限，钳制
      const maxHp = getEffectiveStats(state).hp;
      if (state.adventurer.hp > maxHp) state.adventurer.hp = maxHp;
    }
  }
}

function completeCooking(state: GameState): void {
  const job = state.kitchen.job;
  if (!job) return;
  const recipe = RECIPES[job.recipeId];
  if (!recipe) {
    state.kitchen.job = null;
    return;
  }
  state.kitchen.job = null;
  // 同菜谱效果刷新（不叠加）；不同属性 buff 可共存
  state.kitchen.buffs = state.kitchen.buffs.filter((b) => b.recipeId !== recipe.id);
  state.kitchen.buffs.push({
    recipeId: recipe.id,
    label: recipe.buff.label,
    stat: recipe.buff.stat,
    mult: recipe.buff.mult,
    remainingS: recipe.buff.durationS,
    totalS: recipe.buff.durationS,
  });
  state.adventurer.loyalty = Math.min(100, state.adventurer.loyalty + recipe.mealLoyalty);
  pushLog(
    state,
    'kitchen',
    `${recipe.icon} 「${recipe.name}」出锅！${state.adventurer.name} 大快朵颐（${recipe.buff.label}，持续 ${Math.round(recipe.buff.durationS / 60)} 分钟）`,
  );
}
