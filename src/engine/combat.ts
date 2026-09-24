import { BALANCE, ELITE_CORE_OF, dormRestMult, SIGIL_OF } from '../data/balance';
import {
  CLASSES,
  MAGE_AOE_RATIO,
  PRIEST_HEAL_RATIO,
  PRIEST_IDLE_ATTACK_RATIO,
  ROGUE_CRIT,
} from '../data/classes';
import { MATERIALS } from '../data/materials';
import { MAPS, MAP_DEFS, MONSTERS, ELITE_SIGIL } from '../data/monsters';
import { generateVisitors } from './recruitment';
import { getPartyMembers, type PartyMember } from './party';
import { rollDropsWithBonus, scaledGain } from './drops';
import { pushEvent, pushLog } from './log';
import {
  expToNext,
  getAdventurerStats,
  getPartyDropMult,
  getPartyExpMult,
} from './stats';
import type { GameState, MonsterInstance } from './types';
import { LEVEL_CAP } from './types';

/** 魔物索敌顺序：前排（槽位 0/3）→ 中排（1/4）→ 后排（2） */
const TARGET_ORDER = [0, 3, 1, 4, 2];

/**
 * 生成下一波（地图制无限循环）：
 * 95% → 普通波：从本图魔物池随机抽 2~4 只；
 * 5%  → 精英波：从精英池随机抽 1 只原生 BOSS（自带 BOSS 级数值）+ 1~2 只护卫。
 * rng 消耗顺序：isElite → elitePick → guards → guardPick×N（测试注入用）。
 */
export function spawnWave(state: GameState, rng: () => number = Math.random): void {
  const map = MAPS[state.dungeon.mapId];
  const isElite = rng() < BALANCE.ELITE_CHANCE;
  const pickFrom = (pool: string[]): string => pool[Math.floor(rng() * pool.length)];
  if (isElite) {
    const mid = pickFrom(map.elitePool);
    const sigil = ELITE_SIGIL[mid];
    const guards = BALANCE.ELITE_GUARD_MIN + Math.floor(rng() * (BALANCE.ELITE_GUARD_MAX - BALANCE.ELITE_GUARD_MIN + 1));
    const base = MONSTERS[mid];
    state.dungeon.monsters = [
      {
        uid: state.meta.nextUid++,
        monsterId: mid,
        hp: base.base.hp,
        maxHp: base.base.hp,
        ...(sigil ? { elite: { sigil } } : {}),
      },
      ...Array.from({ length: guards }, () => {
        const gmid = pickFrom(map.monsterPool);
        const gdef = MONSTERS[gmid];
        return { uid: state.meta.nextUid++, monsterId: gmid, hp: gdef.base.hp, maxHp: gdef.base.hp };
      }),
    ];
    state.dungeon.status = 'combat';
    pushEvent(state, {
      kind: 'waveStart',
      wave: state.dungeon.waveCount + 1,
      isElite: true,
      monsters: state.dungeon.monsters.map((m) => ({
        uid: m.uid,
        monsterId: m.monsterId,
        elite: m.elite !== undefined,
      })),
    });
    pushLog(
      state,
      'combat',
      `${map.icon} ${map.name} · 第 ${state.dungeon.waveCount + 1} 波遭遇精英「${base.name}」与 ${guards} 只护卫！`,
    );
    return;
  }
  const count = BALANCE.WAVE_SIZE_MIN + Math.floor(rng() * (BALANCE.WAVE_SIZE_MAX - BALANCE.WAVE_SIZE_MIN + 1));
  const mids = Array.from({ length: count }, () => pickFrom(map.monsterPool));
  state.dungeon.monsters = mids.map((mid) => {
    const def = MONSTERS[mid];
    return { uid: state.meta.nextUid++, monsterId: mid, hp: def.base.hp, maxHp: def.base.hp };
  });
  state.dungeon.status = 'combat';
  pushEvent(state, {
    kind: 'waveStart',
    wave: state.dungeon.waveCount + 1,
    isElite: false,
    monsters: state.dungeon.monsters.map((m) => ({
      uid: m.uid,
      monsterId: m.monsterId,
      elite: false,
    })),
  });
  pushLog(
    state,
    'combat',
    `${map.icon} ${map.name} · 第 ${state.dungeon.waveCount + 1} 波遭遇 ${mids.length} 只魔物`,
  );
}

function rollDamage(
  atk: number,
  def: number,
  rng: () => number,
  critChance: number,
  critMult: number,
): { dmg: number; crit: boolean } {
  const variance = 1 + (rng() * 2 - 1) * BALANCE.DMG_VARIANCE;
  const crit = rng() < critChance;
  return {
    dmg: Math.max(1, Math.round(atk * variance * (crit ? critMult : 1)) - def),
    crit,
  };
}

/** 魔物有效数值（精英 = 原生 BOSS，自带 BOSS 级数值，无需放大） */
function effectiveStats(m: MonsterInstance) {
  const def = MONSTERS[m.monsterId];
  return { ...def.base, exp: def.exp, gold: def.gold };
}

function gainExp(state: GameState, advId: string, baseExp: number, mult: number, rng: () => number): void {
  const adv = state.roster.find((a) => a.id === advId);
  if (!adv) return;
  const gained = scaledGain(baseExp, mult, rng);
  if (gained > 0) state.meta.lifetimeExpEarned += gained;
  // D&D 制：经验攒满即停（不自动升级）——升级需经验满 + 金币/材料的「升级仪式」
  if (adv.level >= LEVEL_CAP) return;
  const need = expToNext(adv.level);
  adv.exp = Math.min(need, adv.exp + gained);
}

function onMonsterKilled(state: GameState, target: MonsterInstance, offlineMult: number, rng: () => number): void {
  const def = MONSTERS[target.monsterId];
  const stats = effectiveStats(target);
  pushEvent(state, { kind: 'death', side: 'monster', targetUid: target.uid, targetMonsterId: target.monsterId });
  // 图鉴：该种魔物累计击杀 +1（键存在 = 已发现；精英计入借用魔物）
  state.meta.monsterKills[target.monsterId] = (state.meta.monsterKills[target.monsterId] ?? 0) + 1;
  const expMult = offlineMult * getPartyExpMult(state);
  for (const m of getPartyMembers(state)) {
    gainExp(state, m.adv.id, stats.exp, expMult, rng);
  }
  const gold = scaledGain(stats.gold, offlineMult, rng);
  state.player.gold += gold;
  state.meta.lifetimeGoldEarned += gold;
  const drops = rollDropsWithBonus(def, offlineMult, getPartyDropMult(state), rng);
  const parts: string[] = [];
  if (gold > 0) parts.push(`金币 +${gold}`);
  for (const d of drops) {
    state.inventory[d.materialId] = (state.inventory[d.materialId] ?? 0) + d.count;
    parts.push(`${MATERIALS[d.materialId]?.name ?? d.materialId} +${d.count}`);
  }
  // 精英掉落：职业徽记 ×1 + 本图魔核 ×1（升级仪式硬通货）
  if (target.elite) {
    const map = MAPS[state.dungeon.mapId];
    const sigil = SIGIL_OF[target.elite.sigil];
    const core = ELITE_CORE_OF[map.number];
    state.inventory[sigil] = (state.inventory[sigil] ?? 0) + 1;
    if (core) {
      state.inventory[core] = (state.inventory[core] ?? 0) + 1;
      parts.push(`${MATERIALS[sigil]?.icon ?? '🎖️'}${MATERIALS[sigil]?.name ?? sigil} +1`);
      parts.push(`${MATERIALS[core]?.icon ?? '🟣'}${MATERIALS[core]?.name ?? core} +1`);
    }
  }
  pushLog(
    state,
    'loot',
    `💀 击杀 ${target.elite ? `精英「${def.name}」` : def.name}${parts.length ? `（${parts.join('，')}）` : ''}`,
  );
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
  const { dmg, crit } = rollDamage(atk, effectiveStats(target).def, rng, critChance, critMult);
  target.hp -= dmg;
  pushEvent(state, {
    kind: 'hit',
    attackerSide: 'party',
    attackerId: member.adv.id,
    targetUid: target.uid,
    targetMonsterId: target.monsterId,
    damage: dmg,
    crit,
  });
  pushLog(
    state,
    'combat',
    `${CLASSES[member.adv.classId].icon} ${member.adv.name} 对 ${def.name} 造成 ${dmg} 伤害${crit ? '（暴击！）' : ''}`,
  );
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
        const dmg = Math.max(1, Math.round(stats.atk * MAGE_AOE_RATIO * variance) - effectiveStats(t).def);
        t.hp -= dmg;
        pushEvent(state, {
          kind: 'hit',
          attackerSide: 'party',
          attackerId: member.adv.id,
          targetUid: t.uid,
          targetMonsterId: t.monsterId,
          damage: dmg,
          crit: false,
        });
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
        pushEvent(state, { kind: 'heal', healerId: member.adv.id, targetId: target.adv.id, amount: heal });
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
  const map = MAPS[state.dungeon.mapId];
  // 精英波判定：波内首位魔物带精英标记（spawnWave 保证精英恒在首位）
  const isEliteWave = state.dungeon.monsters[0]?.elite !== undefined;
  state.meta.totalWavesCleared += 1;
  state.dungeon.waveCount += 1;

  // 存活者回血，阵亡者复活
  for (const m of getPartyMembers(state)) {
    const maxHp = getAdventurerStats(state, m.adv).hp;
    if (m.adv.hp <= 0) {
      m.adv.hp = Math.ceil(maxHp * BALANCE.REVIVE_ON_WAVE_CLEAR);
    } else {
      m.adv.hp = Math.min(maxHp, m.adv.hp + Math.ceil(maxHp * BALANCE.HEAL_ON_WAVE_CLEAR));
    }
  }

  if (isEliteWave) {
    // totalBossKills 字段名保留（存档兼容），语义 = 累计精英击杀
    state.meta.totalBossKills += 1;
    pushEvent(state, { kind: 'waveClear', wave: state.dungeon.waveCount, isElite: true });
    const eliteName = MONSTERS[state.dungeon.monsters[0]?.monsterId]?.name ?? '精英';
    if (!state.meta.mapsFirstCleared.includes(map.number)) {
      state.meta.mapsFirstCleared.push(map.number);
      state.player.reputation += map.firstClearReputation;
      pushLog(state, 'system', `🏆 首次讨伐 ${map.name} 的精英「${eliteName}」！酒馆声望 +${map.firstClearReputation}`);
    }
    // 首次讨伐本图精英 → 解锁下一张地图
    if (map.number === state.dungeon.unlockedMaps && map.number < MAP_DEFS.length) {
      state.dungeon.unlockedMaps = map.number + 1;
      pushLog(state, 'system', `🗺️ 地牢情报更新：解锁 ${MAP_DEFS[map.number].name}！`);
    }
    pushLog(state, 'combat', `👑 精英「${eliteName}」讨伐成功！徽记与魔核入手，队伍继续驻farm循环`);
  } else {
    pushEvent(state, { kind: 'waveClear', wave: state.dungeon.waveCount, isElite: false });
    pushLog(state, 'combat', `✅ 第 ${state.dungeon.waveCount} 波肃清，短暂休整…`);
  }
  state.dungeon.status = 'waveRest';
  state.dungeon.restRemainingS = BALANCE.WAVE_REST_S;
}

function onWiped(state: GameState): void {
  const restS = Math.ceil(BALANCE.REST_AFTER_WIPE_S * dormRestMult(state.tavern.dorm));
  state.dungeon.status = 'resting';
  state.dungeon.restRemainingS = restS;
  pushEvent(state, { kind: 'wipe' });
  pushLog(state, 'combat', `💔 队伍全灭……全员被抬回酒馆休整（约 ${restS} 秒后重返）`);
  grantWipeSubsidy(state);
}

/**
 * 首次团灭应急资助（仅一次）：金币 + 签约材料；若酒馆无客，**立即**安排一批到访
 * （引导"去招募"必须当下可完成，不等下一批周期）。
 * 注意：不计入 lifetimeGoldEarned（那是战斗收入统计，资助是理事会拨款）。
 */
function grantWipeSubsidy(state: GameState): void {
  if (state.meta.wipeSubsidyClaimed) return;
  state.meta.wipeSubsidyClaimed = true;
  state.player.gold += BALANCE.WIPE_SUBSIDY_GOLD;
  const matParts: string[] = [];
  for (const [mid, n] of Object.entries(BALANCE.WIPE_SUBSIDY_MATERIALS)) {
    const count = n ?? 0;
    if (count <= 0) continue;
    state.inventory[mid] = (state.inventory[mid] ?? 0) + count;
    matParts.push(`${MATERIALS[mid]?.icon ?? '📦'}${MATERIALS[mid]?.name ?? mid}×${count}`);
  }
  if (state.recruitment.visitors.length === 0) {
    state.recruitment.visitors = generateVisitors(state, Math.random);
    state.recruitment.nextVisitAt = state.meta.now + BALANCE.VISIT_INTERVAL_S * 1000;
    pushLog(
      state,
      'system',
      `🍻 听说这里遇上了麻烦，${state.recruitment.visitors.length} 位冒险者立刻赶到了酒馆！`,
    );
  }
  pushLog(
    state,
    'system',
    `🆘 酒馆理事会紧急拨款：金币 +${BALANCE.WIPE_SUBSIDY_GOLD}${matParts.length ? `、${matParts.join('、')}` : ''}。独自闯地牢太勉强了——去招募伙伴，组成小队再战！`,
  );
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
      .map((x) => ({ spd: effectiveStats(x).spd, tie: x.uid, kind: 'monster' as const, monster: x })),
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
      const { dmg } = rollDamage(effectiveStats(mo).atk, targetStats.def, rng, 0, 1);
      target.adv.hp -= dmg;
      pushEvent(state, {
        kind: 'hit',
        attackerSide: 'monster',
        attackerUid: mo.uid,
        attackerMonsterId: mo.monsterId,
        targetId: target.adv.id,
        damage: dmg,
        crit: false,
      });
      pushLog(state, 'combat', `${def.icon} ${def.name} 对 ${target.adv.name} 造成 ${dmg} 伤害`);
      if (target.adv.hp <= 0) {
        target.adv.hp = 0;
        pushEvent(state, { kind: 'death', side: 'party', targetId: target.adv.id });
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
