import { BALANCE, MENU_CONFIG, wageOfLevel } from '../data/balance';
import { RECIPES } from '../data/recipes';
import { CLASSES } from '../data/classes';
import { resolveRound, spawnWave } from './combat';
import {
  activeMenuRecipes,
  activeMenuStructures,
  getAdventurerStats,
  menuLoyaltyBonus,
} from './stats';
import { pushEvent, pushLog } from './log';
import { generateVisitors } from './recruitment';
import { getPartyMembers } from './party';
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

  // 模拟时钟推进（招募到访 / 日薪 / 菜单供给都基于它）
  state.meta.now += 1000;

  // ── 地牢（地图制无限循环） ───────────
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
          for (const m of getPartyMembers(state)) {
            m.adv.hp = getAdventurerStats(state, m.adv).hp;
          }
          pushEvent(state, { kind: 'revive' });
          pushLog(state, 'system', '🛏️ 休整完毕，队伍满血重返地牢！');
        }
        spawnWave(state, rng);
      }
      break;
    }
  }

  // ── 替补席休养：每 tick 回复 2% 最大生命 ──
  const partyIds = new Set(state.party.filter((x): x is string => x !== null));
  for (const adv of state.roster) {
    if (partyIds.has(adv.id)) continue;
    const maxHp = getAdventurerStats(state, adv).hp;
    if (adv.hp < maxHp) {
      adv.hp = Math.min(maxHp, adv.hp + Math.ceil(maxHp * 0.02));
    }
  }

  // ── 厨房菜单：每小时消耗材料维持供给（缺料槽位暂停） ──
  if (state.meta.now >= state.kitchen.nextMenuCycleAt) {
    runMenuCycle(state);
    state.kitchen.nextMenuCycleAt = state.meta.now + BALANCE.MENU_CYCLE_MS;
  }

  // ── 招募到访（模拟时钟驱动，离线同样推进） ──
  if (state.meta.now >= state.recruitment.nextVisitAt) {
    state.recruitment.visitors = generateVisitors(state, rng);
    state.recruitment.nextVisitAt = state.meta.now + BALANCE.VISIT_INTERVAL_S * 1000;
    const names = state.recruitment.visitors
      .map((v) => `${v.name}（${CLASSES[v.classId].name}）`)
      .join('、');
    pushLog(state, 'system', `🍻 新的冒险者到访酒馆：${names}`);
  }

  // ── 日薪结算（模拟日界） ─────────────
  settleWagesIfDue(state);

  // ── 菜谱解锁检查 ─────────────────────
  checkRecipeUnlocks(state);
}

/**
 * 菜单供给周期：逐槽尝试支付该菜的材料（不含金币）。
 * 足料 → menuFed=true（效果生效 + 出餐计数 + 忠诚回复）；缺料 → 该槽暂停。
 */
export function runMenuCycle(state: GameState): void {
  const fedCount = state.kitchen.menu.reduce((acc, id) => acc + (id ? 1 : 0), 0);
  if (fedCount === 0) return;
  let okCount = 0;
  for (let i = 0; i < state.kitchen.menu.length; i++) {
    const id = state.kitchen.menu[i];
    if (!id) continue;
    const r = RECIPES[id];
    if (!r) continue;
    const afford = Object.entries(r.cost.materials).every(
      ([mid, need]) => (state.inventory[mid] ?? 0) >= (need ?? 0),
    );
    state.kitchen.menuFed[i] = afford;
    if (afford) {
      for (const [mid, need] of Object.entries(r.cost.materials)) {
        state.inventory[mid] = (state.inventory[mid] ?? 0) - (need ?? 0);
      }
      okCount += 1;
    }
  }
  if (okCount > 0) {
    state.meta.dishesCooked += okCount;
    // 供给成功 → 全员用餐忠诚回复（含结构加成，如 1 级「温饱套餐」+2）
    const loyaltyGain = BALANCE.MENU_LOYALTY_PER_CYCLE + menuLoyaltyBonus(state);
    for (const a of state.roster) {
      a.loyalty = Math.min(100, a.loyalty + loyaltyGain);
    }
    const okNames = state.kitchen.menu
      .filter((id, i) => id && state.kitchen.menuFed[i])
      .map((id) => `${RECIPES[id!]?.icon ?? '🍽️'}${RECIPES[id!]?.name ?? ''}`)
      .join('、');
    const structs = activeMenuStructures(state);
    const structText =
      structs.length > 0
        ? `，触发「${structs.map((lv) => MENU_CONFIG[lv].bonus.name).join('」「')}」`
        : '';
    const failed = fedCount - okCount;
    pushLog(
      state,
      'kitchen',
      `🍽️ 菜单供给：${okNames}${structText}${failed > 0 ? `（${failed} 道缺料暂停）` : ''}`,
    );
  } else {
    pushLog(state, 'kitchen', '⚠️ 菜单食材告罄——所有菜品暂停供给，去地牢囤点材料吧！');
  }
}

function settleWagesIfDue(state: GameState): void {
  const day = Math.floor(state.meta.now / BALANCE.DAY_MS);
  if (day <= state.recruitment.lastWageDay) return;
  state.recruitment.lastWageDay = day;
  if (state.roster.length === 0) return;

  const total = state.roster.reduce((s, a) => s + wageOfLevel(a.level), 0);
  if (state.player.gold >= total) {
    state.player.gold -= total;
    pushLog(state, 'system', `💰 日薪结算：-${total} 金币（${state.roster.length} 名冒险者）`);
  } else if (state.tavern.dorm >= 3) {
    pushLog(state, 'system', `💰 金币不足以支付日薪（需 ${total}），温馨的宿舍留住了大家`);
  } else {
    for (const a of state.roster) {
      a.loyalty = Math.max(0, a.loyalty - BALANCE.LOYALTY_DECAY_NO_BUFF);
    }
    pushLog(state, 'system', `⚠️ 金币不足以支付日薪（需 ${total}），全队忠诚度下降`);
  }

  // 当日无供给菜肴 → 忠诚度缓慢流失（伙食差留不住人）
  if (activeMenuRecipes(state).length === 0) {
    for (const a of state.roster) {
      a.loyalty = Math.max(0, a.loyalty - BALANCE.LOYALTY_DECAY_NO_BUFF);
    }
  }

  // 忠诚归零 → 离店
  const leaving = state.roster.filter((a) => a.loyalty <= 0);
  if (leaving.length > 0) {
    state.roster = state.roster.filter((a) => a.loyalty > 0);
    for (const adv of leaving) {
      const slot = state.party.indexOf(adv.id);
      if (slot >= 0) state.party[slot] = null;
      pushLog(state, 'system', `💔 ${adv.name} 对酒馆彻底失望，收拾行李离开了`);
    }
  }
}

function checkRecipeUnlocks(state: GameState): void {
  for (const r of Object.values(RECIPES)) {
    if (state.kitchen.unlockedRecipes.includes(r.id)) continue;
    let ok = false;
    if (r.unlock.type === 'initial') {
      ok = true;
    } else if (r.unlock.type === 'mapClear') {
      ok = state.meta.mapsFirstCleared.includes(r.unlock.map);
    } else if (r.unlock.type === 'reputation') {
      ok = state.player.reputation >= r.unlock.value;
    }
    if (ok) {
      state.kitchen.unlockedRecipes.push(r.id);
      const attract = r.attraction.classIds.map((c) => CLASSES[c].name).join('、');
      pushLog(
        state,
        'kitchen',
        `📖 新菜谱解锁：「${r.name}」${attract ? `（更吸引 ${attract} 的到访）` : ''}`,
      );
    }
  }
}
