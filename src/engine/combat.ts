import { MONSTERS, FLOORS } from '../data/monsters';
import { MATERIALS } from '../data/materials';
import { BALANCE } from '../data/balance';
import { pushLog } from './log';
import { adventurerLevelCap, expToNext, getEffectiveStats } from './stats';
import { rollDrops, scaledGain } from './drops';
import type { GameState, MonsterInstance } from './types';

/** 生成当前波次魔物 */
export function spawnWave(state: GameState): void {
  const floor = FLOORS[state.dungeon.floorId];
  const wave = floor.waves[state.dungeon.waveIndex];
  state.dungeon.monsters = wave.monsters.map((mid) => {
    const def = MONSTERS[mid];
    return { uid: state.meta.nextUid++, monsterId: mid, hp: def.base.hp, maxHp: def.base.hp };
  });
  state.dungeon.status = 'combat';
  pushLog(
    state,
    'combat',
    `${floor.icon} ${floor.name} · 第 ${state.dungeon.waveIndex + 1}/${floor.waves.length} 波遭遇 ${wave.monsters.length} 只魔物`,
  );
}

function rollDamage(atk: number, def: number, rng: () => number, canCrit: boolean): number {
  const variance = 1 + (rng() * 2 - 1) * BALANCE.DMG_VARIANCE;
  const crit = canCrit && rng() < BALANCE.CRIT_CHANCE ? BALANCE.CRIT_MULT : 1;
  return Math.max(1, Math.round(atk * variance * crit) - def);
}

function gainExp(state: GameState, baseExp: number, mult: number, rng: () => number): void {
  const cap = adventurerLevelCap(state.tavern.trainingGround);
  const gained = scaledGain(baseExp, mult, rng);
  if (gained > 0) state.meta.lifetimeExpEarned += gained;
  if (state.adventurer.level >= cap) return;
  state.adventurer.exp += gained;
  let need = expToNext(state.adventurer.level);
  while (state.adventurer.exp >= need && state.adventurer.level < cap) {
    state.adventurer.exp -= need;
    state.adventurer.level += 1;
    const maxHp = getEffectiveStats(state).hp;
    state.adventurer.hp = Math.min(maxHp, state.adventurer.hp + Math.ceil(maxHp * BALANCE.HEAL_ON_LEVEL_UP));
    pushLog(state, 'level', `🎉 ${state.adventurer.name} 升到了 Lv.${state.adventurer.level}！`);
    need = expToNext(state.adventurer.level);
  }
  if (state.adventurer.level >= cap) state.adventurer.exp = 0;
}

function onMonsterKilled(state: GameState, target: MonsterInstance, mult: number, rng: () => number): void {
  const def = MONSTERS[target.monsterId];
  gainExp(state, def.exp, mult, rng);
  const gold = scaledGain(def.gold, mult, rng);
  state.player.gold += gold;
  state.meta.lifetimeGoldEarned += gold;
  const drops = rollDrops(def, mult, rng);
  const parts: string[] = [];
  if (gold > 0) parts.push(`金币 +${gold}`);
  for (const d of drops) {
    state.inventory[d.materialId] = (state.inventory[d.materialId] ?? 0) + d.count;
    parts.push(`${MATERIALS[d.materialId]?.name ?? d.materialId} +${d.count}`);
  }
  pushLog(state, 'loot', `💀 击杀 ${def.name}${parts.length ? `（${parts.join('，')}）` : ''}`);
}

function onWaveCleared(state: GameState): void {
  const floor = FLOORS[state.dungeon.floorId];
  const wave = floor.waves[state.dungeon.waveIndex];
  state.meta.totalWavesCleared += 1;
  // 清波回血
  const maxHp = getEffectiveStats(state).hp;
  state.adventurer.hp = Math.min(maxHp, state.adventurer.hp + Math.ceil(maxHp * BALANCE.HEAL_ON_WAVE_CLEAR));

  if (wave.isBoss) {
    state.meta.totalBossKills += 1;
    if (!state.meta.bossFirstCleared) {
      state.meta.bossFirstCleared = true;
      state.player.reputation += floor.firstClearReputation;
      const bossName = MONSTERS[wave.monsters[0]]?.name ?? '层底 BOSS';
      pushLog(state, 'system', `🏆 首次击败 ${bossName}！酒馆声望 +${floor.firstClearReputation}`);
    }
    pushLog(state, 'combat', `👑 层底 BOSS 肃清！本层通关，队伍开始驻farm循环`);
  } else {
    pushLog(state, 'combat', `✅ 第 ${state.dungeon.waveIndex + 1}/${floor.waves.length} 波肃清，短暂休整…`);
  }
  state.dungeon.status = 'waveRest';
  state.dungeon.restRemainingS = BALANCE.WAVE_REST_S;
}

function onWiped(state: GameState): void {
  state.adventurer.hp = 0;
  state.dungeon.status = 'resting';
  state.dungeon.restRemainingS = BALANCE.REST_AFTER_WIPE_S;
  state.dungeon.waveIndex = 0;
  pushLog(
    state,
    'combat',
    `💔 队伍全灭……${state.adventurer.name} 被抬回酒馆休整（${BALANCE.REST_AFTER_WIPE_S} 秒后重返）`,
  );
}

/**
 * 结算 1 个战斗回合：按 SPD 降序行动（勇者攻击首个存活魔物，魔物攻击勇者）。
 * 击杀 → 经验/金币/掉落；全灭 → 休整；清波 → 回血 + 波次间隔。
 */
export function resolveRound(state: GameState, rng: () => number, mult: number): void {
  const stats = getEffectiveStats(state);
  const advName = state.adventurer.name;

  interface Action {
    spd: number;
    tieBreak: number;
    isAdv: boolean;
    uid: number;
  }
  const actions: Action[] = [
    { spd: stats.spd, tieBreak: -1, isAdv: true, uid: -1 },
    ...state.dungeon.monsters
      .filter((m) => m.hp > 0)
      .map((m) => ({ spd: MONSTERS[m.monsterId].base.spd, tieBreak: m.uid, isAdv: false, uid: m.uid })),
  ].sort((a, b) => b.spd - a.spd || a.tieBreak - b.tieBreak);

  for (const act of actions) {
    if (state.adventurer.hp <= 0) break;
    if (act.isAdv) {
      const target = state.dungeon.monsters.find((m) => m.hp > 0);
      if (!target) break; // 本回合内波次已被清空
      const def = MONSTERS[target.monsterId];
      const dmg = rollDamage(stats.atk, def.base.def, rng, true);
      target.hp -= dmg;
      pushLog(state, 'combat', `⚔️ ${advName} 对 ${def.name} 造成 ${dmg} 伤害`);
      if (target.hp <= 0) onMonsterKilled(state, target, mult, rng);
    } else {
      const m = state.dungeon.monsters.find((x) => x.uid === act.uid);
      if (!m || m.hp <= 0) continue; // 本回合内已被击杀
      const def = MONSTERS[m.monsterId];
      const dmg = rollDamage(def.base.atk, stats.def, rng, false);
      state.adventurer.hp -= dmg;
      pushLog(state, 'combat', `${def.icon} ${def.name} 对 ${advName} 造成 ${dmg} 伤害`);
    }
  }

  if (state.adventurer.hp <= 0) {
    onWiped(state);
    return;
  }
  if (state.dungeon.monsters.every((m) => m.hp <= 0)) {
    onWaveCleared(state);
  }
}
