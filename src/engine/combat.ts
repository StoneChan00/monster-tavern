import { BALANCE, dormRestMult } from '../data/balance';
import {
  CLASSES,
  MAGE_AOE_RATIO,
  PRIEST_HEAL_RATIO,
  PRIEST_IDLE_ATTACK_RATIO,
  ROGUE_CRIT,
} from '../data/classes';
import { MATERIALS } from '../data/materials';
import { FLOOR_DEFS, FLOORS, MONSTERS } from '../data/monsters';
import { getPartyMembers, type PartyMember } from './party';
import { rollDropsWithBonus, scaledGain } from './drops';
import { pushLog } from './log';
import {
  adventurerLevelCap,
  expToNext,
  getAdventurerStats,
  getPartyDropMult,
  getPartyExpMult,
} from './stats';
import type { GameState, MonsterInstance } from './types';

/** 魔物索敌顺序：前排（槽位 0/3）→ 中排（1/4）→ 后排（2） */
const TARGET_ORDER = [0, 3, 1, 4, 2];

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

function rollDamage(atk: number, def: number, rng: () => number, critChance: number, critMult: number): number {
  const variance = 1 + (rng() * 2 - 1) * BALANCE.DMG_VARIANCE;
  const crit = rng() < critChance ? critMult : 1;
  return Math.max(1, Math.round(atk * variance * crit) - def);
}

function gainExp(state: GameState, advId: string, baseExp: number, mult: number, rng: () => number): void {
  const adv = state.roster.find((a) => a.id === advId);
  if (!adv) return;
  const cap = adventurerLevelCap(state.tavern.trainingGround);
  const gained = scaledGain(baseExp, mult, rng);
  if (gained > 0) state.meta.lifetimeExpEarned += gained;
  if (adv.level >= cap) return;
  adv.exp += gained;
  let need = expToNext(adv.level);
  while (adv.exp >= need && adv.level < cap) {
    adv.exp -= need;
    adv.level += 1;
    const maxHp = getAdventurerStats(state, adv).hp;
    adv.hp = Math.min(maxHp, adv.hp + Math.ceil(maxHp * BALANCE.HEAL_ON_LEVEL_UP));
    pushLog(state, 'level', `🎉 ${adv.name} 升到了 Lv.${adv.level}！`);
    need = expToNext(adv.level);
  }
  if (adv.level >= cap) adv.exp = 0;
}

function onMonsterKilled(state: GameState, target: MonsterInstance, offlineMult: number, rng: () => number): void {
  const def = MONSTERS[target.monsterId];
  const expMult = offlineMult * getPartyExpMult(state);
  for (const m of getPartyMembers(state)) {
    gainExp(state, m.adv.id, def.exp, expMult, rng);
  }
  const gold = scaledGain(def.gold, offlineMult, rng);
  state.player.gold += gold;
  state.meta.lifetimeGoldEarned += gold;
  const drops = rollDropsWithBonus(def, offlineMult, getPartyDropMult(state), rng);
  const parts: string[] = [];
  if (gold > 0) parts.push(`金币 +${gold}`);
  for (const d of drops) {
    state.inventory[d.materialId] = (state.inventory[d.materialId] ?? 0) + d.count;
    parts.push(`${MATERIALS[d.materialId]?.name ?? d.materialId} +${d.count}`);
  }
  pushLog(state, 'loot', `💀 击杀 ${def.name}${parts.length ? `（${parts.join('，')}）` : ''}`);
}

function firstAliveMonster(state: GameState): MonsterInstance | undefined {
  return state.dungeon.monsters.find((m) => m.hp > 0);
}

function weakestAliveMonster(state: GameState): MonsterInstance | undefined {
  let best: MonsterInstance | undefined;
  for (const m of state.dungeon.monsters) {
    if (m.hp <= 0) continue;
    if (!best || m.hp < best.hp) best = m;
  }
  return best;
}

function attackMonster(
  state: GameState,
  member: PartyMember,
  atk: number,
  target: MonsterInstance,
  rng: () => number,
  offlineMult: number,
  critChance: number,
  critMult: number,
): void {
  const def = MONSTERS[target.monsterId];
  const dmg = rollDamage(atk, def.base.def, rng, critChance, critMult);
  target.hp -= dmg;
  pushLog(state, 'combat', `${CLASSES[member.adv.classId].icon} ${member.adv.name} 对 ${def.name} 造成 ${dmg} 伤害`);
  if (target.hp <= 0) onMonsterKilled(state, target, offlineMult, rng);
}

/** 职业行为分发 */
function memberAct(state: GameState, member: PartyMember, rng: () => number, offlineMult: number): void {
  const cls = CLASSES[member.adv.classId];
  const stats = getAdventurerStats(state, member.adv);

  switch (cls.combat) {
    // 战士：攻击首个存活魔物
    case 'strike': {
      const t = firstAliveMonster(state);
      if (t) attackMonster(state, member, stats.atk, t, rng, offlineMult, BALANCE.CRIT_CHANCE, BALANCE.CRIT_MULT);
      break;
    }
    // 盗贼：攻击首个存活魔物，高暴击
    case 'assassin': {
      const t = firstAliveMonster(state);
      if (t) attackMonster(state, member, stats.atk, t, rng, offlineMult, ROGUE_CRIT.chance, ROGUE_CRIT.mult);
      break;
    }
    // 游侠/诗人：攻击残血魔物
    case 'snipe':
    case 'inspire': {
      const t = weakestAliveMonster(state);
      if (t) attackMonster(state, member, stats.atk, t, rng, offlineMult, BALANCE.CRIT_CHANCE, BALANCE.CRIT_MULT);
      break;
    }
    // 法师：奥术冲击（全体伤害，无暴击）
    case 'aoe': {
      for (const t of state.dungeon.monsters) {
        if (t.hp <= 0) continue;
        const def = MONSTERS[t.monsterId];
        const variance = 1 + (rng() * 2 - 1) * BALANCE.DMG_VARIANCE;
        const dmg = Math.max(1, Math.round(stats.atk * MAGE_AOE_RATIO * variance) - def.base.def);
        t.hp -= dmg;
        pushLog(state, 'combat', `${cls.icon} ${member.adv.name} 的奥术冲击席卷 ${def.name}，造成 ${dmg} 伤害`);
        if (t.hp <= 0) onMonsterKilled(state, t, offlineMult, rng);
      }
      break;
    }
    // 牧师：治疗伤势最重的队友；全员满血时以 50% ATK 普攻
    case 'heal': {
      let target: PartyMember | undefined;
      let targetRatio = 1;
      for (const m of getPartyMembers(state)) {
        if (m.adv.hp <= 0) continue;
        const maxHp = getAdventurerStats(state, m.adv).hp;
        const ratio = m.adv.hp / maxHp;
        if (ratio < 1 && ratio < targetRatio) {
          target = m;
          targetRatio = ratio;
        }
      }
      if (target) {
        const maxHp = getAdventurerStats(state, target.adv).hp;
        const variance = 1 + (rng() * 2 - 1) * BALANCE.DMG_VARIANCE;
        const heal = Math.max(1, Math.round(stats.atk * PRIEST_HEAL_RATIO * variance));
        target.adv.hp = Math.min(maxHp, target.adv.hp + heal);
        pushLog(state, 'combat', `${cls.icon} ${member.adv.name} 治疗了 ${target.adv.name} ${heal} 点 HP`);
      } else {
        const t = firstAliveMonster(state);
        if (t) {
          attackMonster(
            state,
            member,
            Math.round(stats.atk * PRIEST_IDLE_ATTACK_RATIO),
            t,
            rng,
            offlineMult,
            0,
            1,
          );
        }
      }
      break;
    }
  }
}

function onWaveCleared(state: GameState): void {
  const floor = FLOORS[state.dungeon.floorId];
  const wave = floor.waves[state.dungeon.waveIndex];
  state.meta.totalWavesCleared += 1;

  // 存活者回血，阵亡者复活
  for (const m of getPartyMembers(state)) {
    const maxHp = getAdventurerStats(state, m.adv).hp;
    if (m.adv.hp <= 0) {
      m.adv.hp = Math.ceil(maxHp * BALANCE.REVIVE_ON_WAVE_CLEAR);
    } else {
      m.adv.hp = Math.min(maxHp, m.adv.hp + Math.ceil(maxHp * BALANCE.HEAL_ON_WAVE_CLEAR));
    }
  }

  if (wave.isBoss) {
    state.meta.totalBossKills += 1;
    if (!state.meta.floorsFirstCleared.includes(floor.id)) {
      state.meta.floorsFirstCleared.push(floor.id);
      state.player.reputation += floor.firstClearReputation;
      const bossName = MONSTERS[wave.monsters[0]]?.name ?? '层底 BOSS';
      pushLog(state, 'system', `🏆 首次击败 ${bossName}！酒馆声望 +${floor.firstClearReputation}`);
    }
    if (floor.number === state.dungeon.highestFloor && floor.number < FLOOR_DEFS.length) {
      state.dungeon.highestFloor = floor.number + 1;
      pushLog(state, 'system', `🗺️ 地牢情报更新：解锁 第 ${floor.number + 1} 层！`);
    }
    pushLog(state, 'combat', `👑 层底 BOSS 肃清！队伍在本层开始驻farm循环`);
  } else {
    pushLog(state, 'combat', `✅ 第 ${state.dungeon.waveIndex + 1}/${floor.waves.length} 波肃清，短暂休整…`);
  }
  state.dungeon.status = 'waveRest';
  state.dungeon.restRemainingS = BALANCE.WAVE_REST_S;
}

function onWiped(state: GameState): void {
  const restS = Math.ceil(BALANCE.REST_AFTER_WIPE_S * dormRestMult(state.tavern.dorm));
  state.dungeon.status = 'resting';
  state.dungeon.restRemainingS = restS;
  state.dungeon.waveIndex = 0;
  pushLog(state, 'combat', `💔 队伍全灭……全员被抬回酒馆休整（约 ${restS} 秒后重返）`);
}

/**
 * 结算 1 个战斗回合：全员按 SPD 降序行动。
 * 魔物按 前排→中排→后排 顺序索敌；全灭 → 休整；清波 → 回血/复活 + 波次间隔。
 */
export function resolveRound(state: GameState, rng: () => number, offlineMult: number): void {
  const members = getPartyMembers(state);
  const alive = members.filter((m) => m.adv.hp > 0);

  if (members.length === 0) return; // 无人编队：地牢暂停，等待玩家指派
  if (alive.length === 0) {
    onWiped(state);
    return;
  }

  interface Action {
    spd: number;
    tie: number;
    kind: 'adv' | 'monster';
    member?: PartyMember;
    monster?: MonsterInstance;
  }
  const actions: Action[] = [
    ...alive.map((m) => ({
      spd: getAdventurerStats(state, m.adv).spd,
      tie: m.slot,
      kind: 'adv' as const,
      member: m,
    })),
    ...state.dungeon.monsters
      .filter((x) => x.hp > 0)
      .map((x) => ({ spd: MONSTERS[x.monsterId].base.spd, tie: x.uid, kind: 'monster' as const, monster: x })),
  ].sort((a, b) => b.spd - a.spd || a.tie - b.tie);

  for (const act of actions) {
    if (state.dungeon.monsters.every((m) => m.hp <= 0)) break;
    if (members.every((m) => m.adv.hp <= 0)) break;

    if (act.kind === 'adv' && act.member) {
      if (act.member.adv.hp <= 0) continue; // 本回合内倒下
      memberAct(state, act.member, rng, offlineMult);
    } else if (act.kind === 'monster' && act.monster) {
      const mo = act.monster;
      if (mo.hp <= 0) continue; // 本回合内被击杀
      // 索敌：前排 → 中排 → 后排的首个存活者
      let target: PartyMember | undefined;
      for (const slot of TARGET_ORDER) {
        const id = state.party[slot];
        if (!id) continue;
        const found = members.find((mm) => mm.adv.id === id && mm.adv.hp > 0);
        if (found) {
          target = found;
          break;
        }
      }
      if (!target) break;
      const def = MONSTERS[mo.monsterId];
      const targetStats = getAdventurerStats(state, target.adv);
      const dmg = rollDamage(def.base.atk, targetStats.def, rng, 0, 1);
      target.adv.hp -= dmg;
      pushLog(state, 'combat', `${def.icon} ${def.name} 对 ${target.adv.name} 造成 ${dmg} 伤害`);
      if (target.adv.hp <= 0) {
        target.adv.hp = 0;
        pushLog(state, 'combat', `💔 ${target.adv.name} 倒下了！`);
      }
    }
  }

  if (members.every((m) => m.adv.hp <= 0)) {
    onWiped(state);
    return;
  }
  if (state.dungeon.monsters.every((m) => m.hp <= 0)) {
    onWaveCleared(state);
  }
}
