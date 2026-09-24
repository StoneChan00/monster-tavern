import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createInitialState } from '../src/engine/initialState';
import { tick, runMenuCycle } from '../src/engine/tick';
import { applyOffline } from '../src/engine/offline';
import { spawnWave } from '../src/engine/combat';
import { classWeights, generateVisitors } from '../src/engine/recruitment';
import {
  adventurerLevelCap,
  activeMenuRecipes,
  expToNext,
  getAdventurerStats,
  getPartyDropMult,
  levelTier,
} from '../src/engine/stats';
import { rollDropsWithBonus } from '../src/engine/drops';
import { mulberry32 } from '../src/engine/rng';
import { serialize, deserialize } from '../src/save/migrate';
import { useGameStore } from '../src/store/gameStore';
import {
  BALANCE,
  levelUpCost,
  rosterCap,
  signCostOfLevel,
  signMaterialOfLevel,
  visitorLevelWeights,
  wageOfLevel,
} from '../src/data/balance';
import { MAP_DEFS, MONSTERS } from '../src/data/monsters';
import { RECIPES } from '../src/data/recipes';
import { MATERIALS } from '../src/data/materials';
import { RACES } from '../src/data/races';
import { CLASS_SPRITES, MONSTER_SPRITES } from '../src/data/sprites';
import {
  ACHIEVEMENTS,
  totalMonsterKills,
  discoveredMonsterCount,
  MONSTER_SPECIES_COUNT,
} from '../src/data/achievements';
import { fmtNum } from '../src/utils/format';
import { SAVE_VERSION, LEVEL_CAP } from '../src/engine/types';
import type { AdventurerState, GameState } from '../src/engine/types';

/** 固定时间戳的新档，保证测试可重复 */
function freshState(): GameState {
  return createInitialState(1_700_000_000_000);
}

function makeAdventurer(id: string, classId: string, level = 5, race = 'human'): AdventurerState {
  return { id, name: id, classId, race, level, exp: 0, hp: 1, loyalty: 50 };
}

/** 重设编队（槽位 0/1/2），并按满血初始化 */
function setupParty(state: GameState, advs: AdventurerState[]): void {
  state.roster = advs;
  state.party = [advs[0]?.id ?? null, advs[1]?.id ?? null, advs[2]?.id ?? null, null, null];
  for (const a of advs) a.hp = getAdventurerStats(state, a).hp;
}

function tickN(s: GameState, seconds: number, seed = 7, offline = false): void {
  tick(s, seconds, { rng: mulberry32(seed), offline });
}

/** 冻结战斗（隔离非战斗系统） */
function freezeCombat(s: GameState): void {
  s.dungeon.status = 'resting';
  s.dungeon.restRemainingS = 10 ** 9;
}

/** 脚本化 RNG（按序列取值） */
function fakeRng(seq: number[]): () => number {
  let i = 0;
  return () => seq[i++ % seq.length];
}

function setStoreState(s: GameState): void {
  useGameStore.setState({
    state: s,
    offlineReport: null,
    clockWarning: false,
    firstWipeGuideOpen: false,
    recruitHighlight: false,
  });
}

// ────────────────────────────────────────────

describe('初始状态 v7', () => {
  it('开局：汉克(Lv1 学徒) + 单人编队 + 3 道初始菜谱 + 60 金币 + 空菜单', () => {
    const s = freshState();
    expect(s.roster.length).toBe(1);
    expect(s.roster[0].name).toBe('铁胃汉克');
    expect(s.roster[0].level).toBe(1);
    expect(s.party[0]).toBe('adv_hank');
    expect(s.party.slice(1).every((x) => x === null)).toBe(true);
    expect(s.dungeon.unlockedMaps).toBe(1);
    expect(s.dungeon.activeMap).toBe(1);
    expect(s.dungeon.mapId).toBe('map_1');
    expect(s.kitchen.unlockedRecipes).toContain('recipe_gel_soup');
    expect(s.kitchen.unlockedRecipes).toContain('recipe_bat_wings');
    expect(s.kitchen.unlockedRecipes).toContain('recipe_gel_soda'); // v7 新初始饮品
    expect(s.kitchen.menu).toHaveLength(7); // 固定 7 槽（当前可用 2 槽）
    expect(s.kitchen.menu.every((x) => x === null)).toBe(true);
    expect(s.player.gold).toBe(60);
    expect(s.meta.wipeSubsidyClaimed).toBe(false); // 首次团灭资助未领取
    expect(s.version).toBe(SAVE_VERSION);
    expect(SAVE_VERSION).toBe(7);
  });
});

describe('存档迁移链（v1 → v7）', () => {
  it('Phase 0 存档完整升级：进度保留、种族补齐、等级折叠、地图重建', () => {
    const v1 = {
      version: 1,
      meta: {
        createdAt: 1,
        lastSavedAt: 2,
        nextUid: 10,
        lifetimeGoldEarned: 100,
        lifetimeExpEarned: 200,
        totalWavesCleared: 3,
        totalBossKills: 1,
        bossFirstCleared: true,
      },
      player: { gold: 55, reputation: 5 },
      adventurer: {
        id: 'adv_hank',
        name: '铁胃汉克',
        classId: 'warrior',
        rarity: 'common',
        level: 4,
        exp: 10,
        hp: 60,
        loyalty: 58,
      },
      inventory: { mat_gel: 7 },
      kitchen: { job: null, unlockedRecipes: ['recipe_gel_soup'], buffs: [] },
      tavern: { trainingGround: 2 },
      dungeon: { floorId: 'floor_mossy', waveIndex: 2, status: 'combat', restRemainingS: 0, monsters: [] },
      log: [],
    };
    const raw = JSON.stringify({ magic: 'monster-tavern-save', version: 1, state: v1, exportedAt: 1 });
    const loaded = deserialize(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(7);
    expect(loaded!.roster[0].name).toBe('铁胃汉克');
    expect(loaded!.roster[0].race).toBe('human'); // v3 补种族
    // v5 等级折叠：common(保底 1) + 旧 4 级 → ceil(4/3.5)=2
    expect(loaded!.roster[0].level).toBe(2);
    expect(loaded!.roster[0].exp).toBe(0);
    expect(loaded!.party[0]).toBe('adv_hank');
    expect(loaded!.tavern.trainingGround).toBe(2);
    expect(loaded!.dungeon.mapId).toBe('map_1'); // 层→图映射
    expect(loaded!.dungeon.unlockedMaps).toBe(2); // bossFirstCleared → 已杀图1 BOSS → 图2 解锁
    expect(loaded!.dungeon.activeMap).toBe(1);
    expect(loaded!.meta.mapsFirstCleared).toEqual([1]); // floor_1 → 图1
    expect(loaded!.meta.monsterKills).toEqual({}); // v4 补图鉴
    expect(loaded!.meta.dishesCooked).toBe(0); // v4 补出餐计数
    expect(loaded!.kitchen.unlockedRecipes).toContain('recipe_bat_wings'); // 新初始菜谱补发
    expect(loaded!.inventory['mat_gel']).toBe(7);
    expect(loaded!.player.reputation).toBe(5);
  });

  it('v4 存档升级 v5：稀有度折叠等级、层→图区间映射、已有图鉴保留', () => {
    const s = freshState();
    const v4Like = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    const meta = v4Like.meta as Record<string, unknown>;
    meta.floorsFirstCleared = ['floor_1', 'floor_5', 'floor_16'];
    const roster = v4Like.roster as Array<Record<string, unknown>>;
    roster[0].rarity = 'epic';
    roster[0].level = 20;
    const dungeon = v4Like.dungeon as Record<string, unknown>;
    dungeon.highestFloor = 17;
    dungeon.farmFloor = 5;
    dungeon.floorId = 'floor_16';
    dungeon.waveIndex = 3;
    meta.monsterKills = { slime: 9 };
    v4Like.version = 4;
    const raw = JSON.stringify({ magic: 'monster-tavern-save', version: 4, state: v4Like, exportedAt: 1 });
    const loaded = deserialize(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(7);
    // epic(保底 4) + 旧 20 级 → ceil(20/3.5)=6
    expect(loaded!.roster[0].level).toBe(6);
    expect(loaded!.roster[0].exp).toBe(0);
    // highestFloor 17 → 6 图全解锁；farmFloor 5(秘银矿道) → 图2
    expect(loaded!.dungeon.unlockedMaps).toBe(6);
    expect(loaded!.dungeon.activeMap).toBe(2);
    expect(loaded!.dungeon.mapId).toBe('map_2');
    // floor_1/5/16 → 图 1/2/6
    expect(loaded!.meta.mapsFirstCleared).toEqual([1, 2, 6]);
    expect(loaded!.meta.monsterKills).toEqual({ slime: 9 }); // v4 图鉴保留
  });

  it('v5 存档升级 v6：补资助标记（未领取），其余字段原样保留', () => {
    const s = freshState();
    const v5Like = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    const meta = v5Like.meta as Record<string, unknown>;
    delete meta.wipeSubsidyClaimed; // v5 无此字段
    v5Like.version = 5;
    const raw = JSON.stringify({ magic: 'monster-tavern-save', version: 5, state: v5Like, exportedAt: 1 });
    const loaded = deserialize(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(7);
    expect(loaded!.meta.wipeSubsidyClaimed).toBe(false); // 旧档无团灭史 → 按未领取处理
    expect(loaded!.player.gold).toBe(60);
    expect(loaded!.roster[0].name).toBe('铁胃汉克');
  });

  it('v6 存档升级 v7：厨房 job/buffs → 菜单制，菜谱解锁保留', () => {
    const s = freshState();
    const v6Like = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    v6Like.version = 6;
    const kitchen = v6Like.kitchen as Record<string, unknown>;
    kitchen.job = { recipeId: 'recipe_gel_soup', remainingS: 5, totalS: 600 }; // 旧烹饪任务
    kitchen.buffs = [];
    const raw = JSON.stringify({ magic: 'monster-tavern-save', version: 6, state: v6Like, exportedAt: 1 });
    const loaded = deserialize(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(7);
    expect(loaded!.kitchen.menu).toHaveLength(7);
    expect(loaded!.kitchen.menu.every((x) => x === null)).toBe(true);
    expect(loaded!.kitchen.menuFed.every((x) => x === false)).toBe(true);
    expect(loaded!.kitchen.unlockedRecipes).toContain('recipe_gel_soup'); // 解锁进度继承
    expect(loaded!.kitchen.nextMenuCycleAt).toBeGreaterThan(loaded!.meta.now);
  });

  it('serialize → deserialize 往返一致（v5，瞬态事件剥离）', () => {
    const s = freshState();
    tickN(s, 60, 5);
    expect(s.events.length).toBeGreaterThan(0);
    const raw = serialize(s);
    expect(JSON.parse(raw).state.events).toBeUndefined(); // 事件不进存档
    const round = deserialize(raw);
    expect(round).not.toBeNull();
    expect(round!.events).toEqual([]);
    expect({ ...round, events: s.events }).toEqual(s);
  });

  it('非法存档被拒绝', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ magic: 'wrong', version: 4, state: {} }))).toBeNull();
    expect(deserialize(JSON.stringify({ magic: 'monster-tavern-save', version: 4 }))).toBeNull();
  });
});

describe('地图制随机波次（精英体系）', () => {
  it('6 张地图结构完整：魔物/精英池已注册、首杀声望递增、职业徽记全覆盖', () => {
    expect(MAP_DEFS).toHaveLength(6);
    const all = new Set<string>();
    let prevRep = 0;
    const sigilClasses = new Set<string>();
    for (const m of MAP_DEFS) {
      expect(m.monsterPool.length).toBeGreaterThan(0);
      expect(m.elitePool).toHaveLength(6); // 每图六只职业向精英
      for (const mid of m.monsterPool) {
        expect(MONSTERS[mid]).toBeDefined();
        all.add(mid);
      }
      for (const e of m.elitePool) {
        expect(MONSTERS[e.base]).toBeDefined();
        all.add(e.base); // 精英借用体型的魔物同样有归属
        sigilClasses.add(e.sigil);
      }
      expect(m.firstClearReputation).toBeGreaterThan(prevRep);
      prevRep = m.firstClearReputation;
    }
    // 59 种全部有归属（常规池 + 扩充怪）
    expect(all.size).toBe(Object.keys(MONSTERS).length);
    // 每图的六只精英分别对应六个职业
    expect(sigilClasses.size).toBe(6);
    for (const m of MAP_DEFS) {
      expect(new Set(m.elitePool.map((e) => e.sigil)).size).toBe(6);
    }
  });

  it('普通波：2~4 只、全部来自本图池', () => {
    const s = freshState();
    for (let i = 0; i < 20; i++) {
      // 屏蔽精英判定（首值钳到 0.5），只测普通波组波
      const base = mulberry32(i + 1);
      const noEliteRng = (): number => {
        const v = base();
        return v < BALANCE.ELITE_CHANCE ? 0.5 : v;
      };
      spawnWave(s, noEliteRng);
      expect(s.dungeon.monsters.length).toBeGreaterThanOrEqual(2);
      expect(s.dungeon.monsters.length).toBeLessThanOrEqual(4);
      const pool = new Set(MAP_DEFS[0].monsterPool);
      for (const m of s.dungeon.monsters) {
        expect(pool.has(m.monsterId)).toBe(true);
        expect(m.elite).toBeUndefined();
      }
    }
  });

  it('精英波：注入 rng 强制触发，精英居首 + 1~2 护卫 + 数值放大', () => {
    const s = freshState();
    // rng 消耗顺序：isElite(0.01) → elitePick(0→e1_warrior 苔藓兽王) → guards(0.99→2 只) → 护卫×2(0.5)
    spawnWave(s, fakeRng([0.01, 0, 0.99, 0.5, 0.5]));
    expect(s.dungeon.monsters.length).toBe(3);
    const elite = s.dungeon.monsters[0];
    expect(elite.elite).toBeDefined();
    expect(elite.elite!.sigil).toBe('warrior');
    const baseDef = MONSTERS[elite.monsterId];
    expect(elite.maxHp).toBe(Math.round(baseDef.base.hp * BALANCE.ELITE_HP_MULT)); // hp ×2.2
    expect(s.events.find((e) => e.kind === 'waveStart')).toMatchObject({
      kind: 'waveStart',
      isElite: true,
    });
    // 护卫无精英标记
    expect(s.dungeon.monsters.slice(1).every((m) => m.elite === undefined)).toBe(true);
  });

  it('无限循环：清波后波次持续推进（无总波数上限）', () => {
    const s = freshState();
    setupParty(s, [makeAdventurer('w1', 'warrior', 10)]);
    tickN(s, 120, 11);
    expect(s.meta.totalWavesCleared).toBeGreaterThan(3);
    expect(s.dungeon.waveCount).toBeGreaterThan(3);
  });
});

describe('多单位战斗', () => {
  it('三人队（战/法/牧）能连续清波', () => {
    const s = freshState();
    setupParty(s, [makeAdventurer('w1', 'warrior', 5), makeAdventurer('m1', 'mage', 5), makeAdventurer('p1', 'priest', 5)]);
    tickN(s, 60, 11);
    expect(s.meta.totalWavesCleared).toBeGreaterThan(0);
    expect(s.roster.every((a) => a.hp > 0)).toBe(true); // 三人全部存活
  });

  it('法师 AOE：一回合内命中所有存活魔物', () => {
    const s = freshState();
    setupParty(s, [makeAdventurer('m1', 'mage', 5)]);
    tickN(s, 2, 21); // 第 1 秒生成首波，第 2 秒开打
    const damaged = s.dungeon.monsters.filter((m) => m.hp < m.maxHp).length;
    expect(damaged).toBe(s.dungeon.monsters.length);
  });

  it('牧师：优先治疗伤势最重的队友', () => {
    const s = freshState();
    const warrior = makeAdventurer('w1', 'warrior', 5);
    const priest = makeAdventurer('p1', 'priest', 5);
    setupParty(s, [warrior, priest]);
    warrior.hp = Math.floor(getAdventurerStats(s, warrior).hp * 0.3);
    const before = warrior.hp;
    tickN(s, 2, 31);
    expect(warrior.hp).toBeGreaterThan(before);
  });

  it('魔物优先攻击前排，后排受到保护', () => {
    const s = freshState();
    const warrior = makeAdventurer('w1', 'warrior', 3);
    const mage = makeAdventurer('m1', 'mage', 3);
    setupParty(s, [warrior, mage]); // 槽位 0=前排战士，槽位 1=中排法师
    const dmgWarriorBefore = s.log.filter((l) => l.text.includes('对 w1')).length;
    const dmgMageBefore = s.log.filter((l) => l.text.includes('对 m1')).length;
    tickN(s, 12, 41);
    const dmgWarrior = s.log.filter((l) => l.text.includes('对 w1')).length - dmgWarriorBefore;
    const dmgMage = s.log.filter((l) => l.text.includes('对 m1')).length - dmgMageBefore;
    expect(dmgWarrior).toBeGreaterThan(0);
    expect(dmgMage).toBe(0); // 前排存活时，魔物不攻击中排
  });

  it('空编队：波照常生成但无战斗推进', () => {
    const s = freshState();
    s.party = [null, null, null, null, null];
    tickN(s, 10, 51);
    expect(s.dungeon.monsters.length).toBeGreaterThan(0);
    expect(s.dungeon.monsters[0].hp).toBe(s.dungeon.monsters[0].maxHp);
  });
});

describe('羁绊与光环', () => {
  it('坚守（战士+牧师）：全队 DEF +10%', () => {
    const solo = freshState();
    const w1 = makeAdventurer('w1', 'warrior', 5);
    setupParty(solo, [w1]);
    const duo = freshState();
    const w2 = makeAdventurer('w2', 'warrior', 5);
    const p2 = makeAdventurer('p2', 'priest', 5);
    setupParty(duo, [w2, p2]);
    expect(getAdventurerStats(duo, w2).def).toBeGreaterThan(getAdventurerStats(solo, w1).def);
  });

  it('杂牌军（3 职业）：掉落率 +8%', () => {
    const duo = freshState();
    setupParty(duo, [makeAdventurer('w', 'warrior', 5), makeAdventurer('m', 'mage', 5)]);
    expect(getPartyDropMult(duo)).toBe(1);
    const trio = freshState();
    setupParty(trio, [
      makeAdventurer('w', 'warrior', 5),
      makeAdventurer('m', 'mage', 5),
      makeAdventurer('r', 'rogue', 5),
    ]);
    expect(getPartyDropMult(trio)).toBeCloseTo(1.08, 5);
  });
});

describe('推图与解锁', () => {
  it('首次讨伐本图精英：声望一次性 + 解锁下一张图 + 徽记/魔核掉落', () => {
    const s = freshState();
    s.roster[0].level = 8;
    s.roster[0].hp = getAdventurerStats(s, s.roster[0]).hp;
    // 强制精英波（e1_warrior 苔藓兽王 base wolf_alpha + 2 护卫）
    spawnWave(s, fakeRng([0.01, 0, 0.99, 0.5, 0.5]));
    tickN(s, 120, 3);
    expect(s.meta.totalBossKills).toBeGreaterThanOrEqual(1); // 语义 = 精英击杀
    expect(s.player.reputation).toBe(MAP_DEFS[0].firstClearReputation);
    expect(s.dungeon.unlockedMaps).toBe(2);
    expect(s.meta.mapsFirstCleared).toContain(1);
    // 精英掉落：战士徽记 + 图1 魔核（苔藓古树心）
    expect(s.inventory['mat_sigil_warrior']).toBeGreaterThanOrEqual(1);
    expect(s.inventory['mat_elite_core_1']).toBeGreaterThanOrEqual(1);
  });

  it('setActiveMap：解锁范围内切换生效，未解锁/越界拒绝', () => {
    const s = freshState();
    s.dungeon.unlockedMaps = 3;
    setStoreState(s);
    const ok = useGameStore.getState().setActiveMap(2);
    expect(ok.ok).toBe(true);
    expect(useGameStore.getState().state.dungeon.activeMap).toBe(2);
    expect(useGameStore.getState().state.dungeon.mapId).toBe('map_2');
    const bad = useGameStore.getState().setActiveMap(4);
    expect(bad.ok).toBe(false);
  });
});

describe('D&D 等级制招募', () => {
  it('访客自带 1~10 等级；等级权重随声望温和倾斜', () => {
    const s = freshState();
    const w0 = visitorLevelWeights(0);
    expect(w0[0]).toBeGreaterThan(w0[9] * 100); // Lv1 远多于 Lv10
    const w100 = visitorLevelWeights(100);
    expect(w100[9]).toBeGreaterThan(w0[9]); // 声望抬高高等级权重
    const visitors = generateVisitors(s, mulberry32(5));
    expect(visitors.length).toBeGreaterThan(0);
    for (const v of visitors) {
      expect(v.level).toBeGreaterThanOrEqual(1);
      expect(v.level).toBeLessThanOrEqual(10);
      expect(v.costGold).toBe(signCostOfLevel(v.level));
      expect(v.costMaterial).toEqual(signMaterialOfLevel(v.level));
    }
  });

  it('已解锁菜谱提升对应职业的到访权重', () => {
    const s = freshState();
    const before = classWeights(s);
    s.kitchen.unlockedRecipes.push('recipe_beast_roast'); // 吸引战士/游侠
    const after = classWeights(s);
    expect(after.get('warrior')).toBeGreaterThan(before.get('warrior')!);
    expect(after.get('mage')).toBe(before.get('mage')!);
  });

  it('store.signVisitor：扣费、入队（保留访客等级）、占用上限', () => {
    const s = freshState();
    s.recruitment.visitors = generateVisitors(s, mulberry32(5));
    const v = s.recruitment.visitors[0];
    s.player.gold = 999999;
    s.inventory[v.costMaterial.materialId] = 999999;
    setStoreState(s);
    const r = useGameStore.getState().signVisitor(v.uid);
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.roster.length).toBe(2);
    expect(after.roster[1].level).toBe(v.level); // 签约保留 D&D 等级
    expect(after.recruitment.visitors.length).toBe(1);
    // 满员后拒绝
    while (after.roster.length < rosterCap(after.tavern.lounge)) {
      const extra = makeAdventurer(`filler_${after.roster.length}`, 'warrior', 1);
      after.roster.push(extra);
    }
    after.player.gold = 999999;
    after.inventory['mat_carapace'] = 999999;
    after.inventory['mat_mithril'] = 999999;
    after.inventory['mat_core'] = 999999;
    const v2 = after.recruitment.visitors[0];
    const r2 = useGameStore.getState().signVisitor(v2.uid);
    expect(r2.ok).toBe(false);
    expect(r2.message).toContain('替补席');
  });

  it('store.assignToSlot：声望锁槽位；同槽互换', () => {
    const s = freshState();
    const extra = makeAdventurer('a2', 'mage', 3);
    s.roster.push(extra);
    setStoreState(s);
    // 槽位 3 需要声望 20
    const locked = useGameStore.getState().assignToSlot(3, 'a2');
    expect(locked.ok).toBe(false);
    // 汉克槽 0 → 槽 1，法师顶替槽 0
    const swap = useGameStore.getState().assignToSlot(1, 'adv_hank');
    expect(swap.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.party[1]).toBe('adv_hank');
    const assign2 = useGameStore.getState().assignToSlot(0, 'a2');
    expect(assign2.ok).toBe(true);
    expect(useGameStore.getState().state.party[0]).toBe('a2');
  });
});

describe('D&D 升级仪式', () => {
  it('经验攒满即停：不自动升级', () => {
    const s = freshState();
    s.roster[0].exp = expToNext(1);
    const capped = s.roster[0].exp;
    tickN(s, 10, 21);
    expect(s.roster[0].level).toBe(1); // 未自动升级
    expect(s.roster[0].exp).toBe(capped); // 封顶不再涨
  });

  it('levelUpAdventurer：经验满 + 扣金币材料 → 升级回血', () => {
    const s = freshState();
    s.roster[0].exp = expToNext(1);
    s.player.gold = 9999;
    s.inventory['mat_gel'] = 99;
    setStoreState(s);
    const r = useGameStore.getState().levelUpAdventurer('adv_hank');
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    const cost = levelUpCost(2, 'warrior')!;
    expect(after.roster[0].level).toBe(2);
    expect(after.roster[0].exp).toBe(0);
    expect(after.player.gold).toBe(9999 - cost.gold);
    expect(after.inventory['mat_gel']).toBe(99 - (cost.materials.mat_gel ?? 0));
    expect(after.events.some((e) => e.kind === 'levelup')).toBe(true);
  });

  it('升级费用曲线：2-3 级普通掉落，4-8 级职业徽记+对应图魔核，9/10 返回 null', () => {
    expect(levelUpCost(2, 'warrior')!.materials).toEqual({ mat_gel: 10 });
    expect(levelUpCost(3, 'warrior')!.materials).toEqual({ mat_carapace: 8 });
    const c4 = levelUpCost(4, 'mage')!;
    expect(c4.materials.mat_sigil_mage).toBe(1);
    expect(c4.materials.mat_elite_core_1).toBe(3); // 升到 4 级 ← 图1 精英魔核
    const c8 = levelUpCost(8, 'rogue')!;
    expect(c8.materials.mat_sigil_rogue).toBe(3);
    expect(c8.materials.mat_elite_core_5).toBe(7); // 升到 8 级 ← 图5
    expect(levelUpCost(9, 'warrior')).toBeNull();
    expect(levelUpCost(10, 'warrior')).toBeNull();
  });

  it('经验不足 / 材料不足 / 10 级封顶 均拒绝', () => {
    const s = freshState();
    s.roster[0].exp = 0;
    setStoreState(s);
    expect(useGameStore.getState().levelUpAdventurer('adv_hank').ok).toBe(false);

    const s2 = freshState();
    s2.roster[0].exp = expToNext(1);
    s2.player.gold = 0;
    setStoreState(s2);
    expect(useGameStore.getState().levelUpAdventurer('adv_hank').ok).toBe(false);

    const s3 = freshState();
    s3.roster[0].level = LEVEL_CAP;
    s3.roster[0].exp = 99999;
    setStoreState(s3);
    const r3 = useGameStore.getState().levelUpAdventurer('adv_hank');
    expect(r3.ok).toBe(false);
    expect(r3.message).toContain('传奇');
  });

  it('9、10 级仪式暂未开放：8 级经验满也拒绝（UPGRADE_CAP）', () => {
    const s = freshState();
    s.roster[0].level = BALANCE.UPGRADE_CAP;
    s.roster[0].exp = 99999;
    s.player.gold = 999999;
    setStoreState(s);
    const r = useGameStore.getState().levelUpAdventurer('adv_hank');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('暂未开放');
  });

  it('等级档位：Lv10 传奇、Lv5 资深、Lv1 学徒', () => {
    expect(levelTier(10).label).toBe('传奇');
    expect(levelTier(9).label).toBe('传奇');
    expect(levelTier(7).label).toBe('大师');
    expect(levelTier(5).label).toBe('资深');
    expect(levelTier(3).label).toBe('老练');
    expect(levelTier(1).label).toBe('学徒');
    expect(adventurerLevelCap(0)).toBe(10);
    expect(adventurerLevelCap(5)).toBe(10); // 训练场不再抬上限
  });

  it('10 级曲线强度：Lv10 ≈ 3 倍于 Lv1（perLevel 承担分档）', () => {
    const s = freshState();
    const lv1 = makeAdventurer('a1', 'warrior', 1);
    const lv10 = makeAdventurer('a10', 'warrior', 10);
    s.roster = [lv10];
    s.party = [lv10.id, null, null, null, null];
    const atk10 = getAdventurerStats(s, lv10).atk;
    s.roster = [lv1];
    s.party = [lv1.id, null, null, null, null];
    const atk1 = getAdventurerStats(s, lv1).atk;
    expect(atk10).toBeGreaterThan(atk1 * 2.5);
  });
});

describe('日薪与忠诚度', () => {
  function advanceOneDay(s: GameState): void {
    const day = Math.floor(s.meta.now / BALANCE.DAY_MS);
    s.meta.now = (day + 1) * BALANCE.DAY_MS + 1000;
    s.recruitment.lastWageDay = day;
    tickN(s, 1, 71);
  }

  it('正常支付：按等级日薪扣除（汉克 Lv1 → 2 金币）', () => {
    const s = freshState();
    const gold0 = s.player.gold;
    advanceOneDay(s);
    expect(s.player.gold).toBe(gold0 - wageOfLevel(1));
    expect(wageOfLevel(1)).toBe(2);
    expect(wageOfLevel(10)).toBe(200); // 10 级传奇日薪
  });

  it('欠薪且无菜肴：忠诚度 -4（欠薪+伙食差）；归零离店', () => {
    const s = freshState();
    s.player.gold = 0;
    advanceOneDay(s);
    expect(s.roster[0].loyalty).toBe(50 - 4);
    // 忠诚归零 → 离店
    s.roster[0].loyalty = 1;
    advanceOneDay(s);
    expect(s.roster.length).toBe(0);
    expect(s.party[0]).toBeNull();
  });

  it('宿舍 3 级：欠薪不再掉忠诚', () => {
    const s = freshState();
    s.player.gold = 0;
    s.tavern.dorm = 3;
    const loyalty0 = s.roster[0].loyalty;
    advanceOneDay(s);
    // 欠薪惩罚被宿舍抵消，仅剩"无菜肴"的 -2
    expect(s.roster[0].loyalty).toBe(loyalty0 - BALANCE.LOYALTY_DECAY_NO_BUFF);
  });
});

describe('菜谱与厨房（v7 菜单制）', () => {
  it('设置菜单并供给：效果即时生效，每小时消耗材料并出餐', () => {
    const s = freshState();
    freezeCombat(s);
    s.roster[0].level = 5; // 提高级别避免低攻取整吃掉 +25%
    s.roster[0].hp = getAdventurerStats(s, s.roster[0]).hp;
    s.inventory['mat_gel'] = 10;
    const atk0 = getAdventurerStats(s, s.roster[0]).atk; // 基线（设菜单前）
    s.kitchen.menu[0] = 'recipe_gel_soup'; // 凝胶浓汤：gel×3/小时，ATK +25%
    s.kitchen.menuFed[0] = true;
    // 厨房 0 级无结构要求 → 立即生效
    expect(activeMenuRecipes(s)).toEqual(['recipe_gel_soup']);
    expect(getAdventurerStats(s, s.roster[0]).atk).toBeGreaterThan(atk0);
    // 供给周期：消耗 gel×3，出餐计数，忠诚回复
    const loyalty0 = s.roster[0].loyalty;
    runMenuCycle(s);
    expect(s.kitchen.menuFed[0]).toBe(true);
    expect(s.inventory['mat_gel']).toBe(10 - 3);
    expect(s.meta.dishesCooked).toBe(1);
    expect(s.roster[0].loyalty).toBe(Math.min(100, loyalty0 + BALANCE.MENU_LOYALTY_PER_CYCLE));
  });

  it('缺料 → 槽位暂停供给，效果随之失效', () => {
    const s = freshState();
    freezeCombat(s);
    s.inventory['mat_gel'] = 0;
    s.kitchen.menu[0] = 'recipe_gel_soup';
    s.kitchen.menuFed[0] = true; // 上一周期供给过（生效中）
    expect(activeMenuRecipes(s)).toEqual(['recipe_gel_soup']);
    runMenuCycle(s);
    expect(s.kitchen.menuFed[0]).toBe(false);
    expect(activeMenuRecipes(s)).toEqual([]);
  });

  it('厨房 1 级结构要求：前菜+主菜+饮品 覆盖才生效', () => {
    const s = freshState();
    freezeCombat(s);
    s.tavern.kitchen = 1;
    s.kitchen.unlockedRecipes.push('recipe_beast_roast'); // 主菜（mapClear:1）
    // gel_soda（饮品）与 bat_wings（前菜）为初始解锁
    s.kitchen.menu[0] = 'recipe_bat_wings';
    s.kitchen.menu[1] = 'recipe_beast_roast';
    s.kitchen.menuFed[0] = true;
    s.kitchen.menuFed[1] = true;
    expect(activeMenuRecipes(s)).toEqual([]); // 缺饮品 → 整体暂停
    s.kitchen.menu[2] = 'recipe_gel_soda';
    s.kitchen.menuFed[2] = true;
    expect(activeMenuRecipes(s).length).toBe(3); // 结构满足 → 全部生效
  });

  it('首杀图1精英解锁 mapClear 菜谱', () => {
    const s = freshState();
    s.meta.mapsFirstCleared = [1, 2];
    tickN(s, 1, 83);
    expect(s.kitchen.unlockedRecipes).toContain('recipe_carapace_chips'); // mapClear: 1
  });

  it('store.setMenuSlot：上菜即尝试供给（足料立即生效 / 缺料暂停 / 重复拒绝）', () => {
    const s = freshState();
    freezeCombat(s);
    s.inventory['mat_gel'] = 3;
    setStoreState(s);
    const r = useGameStore.getState().setMenuSlot(0, 'recipe_gel_soup');
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.kitchen.menu[0]).toBe('recipe_gel_soup');
    expect(after.kitchen.menuFed[0]).toBe(true);
    expect(after.inventory['mat_gel']).toBe(0); // 上菜即扣一次供给
    // 同菜不能重复上菜单
    expect(useGameStore.getState().setMenuSlot(1, 'recipe_gel_soup').ok).toBe(false);
    // 缺料上菜 → 暂停态
    const r2 = useGameStore.getState().setMenuSlot(1, 'recipe_bat_wings');
    expect(r2.ok).toBe(true);
    expect(useGameStore.getState().state.kitchen.menuFed[1]).toBe(false);
  });
});

describe('经验获取', () => {
  it('经验菜肴（菜单供给中）放大击杀经验', () => {
    const a = freshState();
    const b = freshState();
    b.kitchen.menu[0] = 'recipe_mush_wine'; // 经验获取 +35%
    b.kitchen.menuFed[0] = true;
    tickN(a, 40, 95);
    tickN(b, 40, 95);
    expect(b.meta.lifetimeExpEarned).toBeGreaterThan(a.meta.lifetimeExpEarned);
  });
});

describe('掉落', () => {
  it('掉落率加成：概率触发额外掉落并合并', () => {
    const slime = MONSTERS.slime!;
    // 序列：首掉落判定→数量进位判定→加成判定(0.3<0.5 触发)→额外掉落判定→数量判定
    const drops = rollDropsWithBonus(slime, 1, 1.5, fakeRng([0.05, 0.99, 0.3, 0.05, 0.99]));
    expect(drops).toEqual([{ materialId: 'mat_gel', count: 2 }]);
  });

  it('500 秒压力：掉落全在材料表内、日志不超限', () => {
    const s = freshState();
    setupParty(s, [makeAdventurer('w1', 'warrior', 8)]);
    tickN(s, 500, 7);
    const valid = new Set(Object.keys(MATERIALS));
    for (const k of Object.keys(s.inventory)) {
      expect(valid.has(k)).toBe(true);
    }
    expect(s.log.length).toBeLessThanOrEqual(BALANCE.LOG_LIMIT);
  });
});

describe('v4 图鉴计数', () => {
  it('击杀魔物计入 meta.monsterKills（按种类累计；精英计入借用魔物）', () => {
    const s = freshState();
    expect(s.meta.monsterKills).toEqual({});
    tickN(s, 60, 21);
    expect(totalMonsterKills(s)).toBeGreaterThan(0);
    expect(discoveredMonsterCount(s)).toBeGreaterThan(0);
  });

  it('菜单供给出餐计入 meta.dishesCooked（每小时每道菜）', () => {
    const s = freshState();
    freezeCombat(s);
    s.inventory['mat_gel'] = 10;
    s.kitchen.menu[0] = 'recipe_gel_soup';
    s.kitchen.menuFed[0] = false;
    runMenuCycle(s);
    expect(s.meta.dishesCooked).toBe(1);
    runMenuCycle(s);
    expect(s.meta.dishesCooked).toBe(2);
    expect(s.inventory['mat_gel']).toBe(10 - 6);
  });
});

describe('成就（派生式 check）', () => {
  function achieved(id: string, s: GameState): boolean {
    return ACHIEVEMENTS.find((a) => a.id === id)!.check(s);
  }

  it('开门营业：清波后达成', () => {
    const s = freshState();
    expect(achieved('open_for_business', s)).toBe(false);
    tickN(s, 30, 21);
    expect(achieved('open_for_business', s)).toBe(true);
  });

  it('小队初成 / 满编出征：按 roster 与编队判定', () => {
    const s = freshState();
    expect(achieved('first_squad', s)).toBe(false);
    while (s.roster.length < 3) {
      s.roster.push(makeAdventurer(`m${s.roster.length}`, 'warrior', 3));
    }
    expect(achieved('first_squad', s)).toBe(true);
    expect(achieved('full_party', s)).toBe(false);
    while (s.roster.length < 5) {
      s.roster.push(makeAdventurer(`f${s.roster.length}`, 'mage', 3));
    }
    s.party = s.roster.slice(0, 5).map((a) => a.id);
    expect(achieved('full_party', s)).toBe(true);
  });

  it('地图进度成就：图 2 / 4 / 6 首杀判定', () => {
    const s = freshState();
    expect(achieved('map_2', s)).toBe(false);
    s.meta.mapsFirstCleared = [1];
    expect(achieved('map_2', s)).toBe(false);
    s.meta.mapsFirstCleared = [1, 2];
    expect(achieved('map_2', s)).toBe(true);
    expect(achieved('map_4', s)).toBe(false);
    s.meta.mapsFirstCleared = [1, 2, 3, 4, 5, 6];
    expect(achieved('map_4', s)).toBe(true);
    expect(achieved('map_6', s)).toBe(true);
  });

  it('击杀阶梯：50 / 100 / 1000', () => {
    const s = freshState();
    s.meta.monsterKills.slime = 50;
    expect(achieved('slayer_50', s)).toBe(true);
    expect(achieved('slayer_100', s)).toBe(false);
    s.meta.monsterKills.slime = 1000;
    expect(achieved('slayer_1000', s)).toBe(true);
  });

  it('传奇之约：拥有 10 级冒险者（等级即稀有度）', () => {
    const s = freshState();
    expect(achieved('legendary_pact', s)).toBe(false);
    s.roster.push(makeAdventurer('leg', 'bard', 10));
    expect(achieved('legendary_pact', s)).toBe(true);
  });

  it('魔物美食家：解锁全部菜谱达成', () => {
    const s = freshState();
    s.kitchen.unlockedRecipes = Object.keys(RECIPES);
    expect(achieved('gourmet', s)).toBe(true);
  });

  it('万国来朝：9 种族 roster 判定', () => {
    const s = freshState();
    const races = Object.keys(RACES);
    for (const r of races) s.roster.push(makeAdventurer(`r_${r}`, 'warrior', 3, r));
    expect(achieved('nine_races', s)).toBe(true);
  });

  it('图鉴阶梯：过半与全收录', () => {
    const s = freshState();
    const half = Math.ceil(MONSTER_SPECIES_COUNT / 2);
    const ids = Object.keys(MONSTERS);
    for (const mid of ids.slice(0, half)) s.meta.monsterKills[mid] = 1;
    expect(achieved('codex_half', s)).toBe(true);
    expect(achieved('codex_full', s)).toBe(false);
    for (const mid of ids) s.meta.monsterKills[mid] = 1;
    expect(achieved('codex_full', s)).toBe(true);
  });
});

describe('迷宫饭式数据完整性', () => {
  it('所有魔物掉落与菜谱材料均有效', () => {
    const matIds = new Set(Object.keys(MATERIALS));
    for (const m of Object.values(MONSTERS)) {
      expect(m.drops.length).toBeGreaterThan(0);
      for (const d of m.drops) {
        expect(matIds.has(d.materialId)).toBe(true);
      }
    }
    for (const r of Object.values(RECIPES)) {
      expect(Object.keys(r.cost.materials).length).toBeGreaterThanOrEqual(1);
      for (const mid of Object.keys(r.cost.materials)) {
        expect(matIds.has(mid)).toBe(true);
      }
    }
  });

  it('种族属性修正：精灵快于人类，矮人更硬', () => {
    const s = freshState();
    const human = makeAdventurer('h', 'warrior', 5, 'human');
    const elf = makeAdventurer('e', 'warrior', 5, 'elf');
    const dwarf = makeAdventurer('d', 'warrior', 5, 'dwarf');
    s.roster = [human, elf, dwarf];
    s.party = [human.id, elf.id, dwarf.id, null, null];
    expect(getAdventurerStats(s, elf).spd).toBeGreaterThan(getAdventurerStats(s, human).spd);
    expect(getAdventurerStats(s, dwarf).def).toBeGreaterThan(getAdventurerStats(s, human).def);
    expect(getAdventurerStats(s, dwarf).hp).toBeGreaterThan(getAdventurerStats(s, human).hp);
  });

  it('访客携带种族且在种族表内', () => {
    const s = freshState();
    const visitors = generateVisitors(s, mulberry32(5));
    expect(visitors.length).toBeGreaterThan(0);
    for (const v of visitors) {
      expect(RACES[v.race]).toBeDefined();
      expect(RACES[v.race]!.namePool).toContain(v.name);
    }
  });
});

describe('替补席与休整', () => {
  it('替补席成员每 tick 回复 2% 最大生命', () => {
    const s = freshState();
    const bench = makeAdventurer('bench1', 'mage', 8);
    s.roster.push(bench); // 不编队
    bench.hp = Math.floor(getAdventurerStats(s, bench).hp * 0.3);
    const before = bench.hp;
    tickN(s, 10, 101);
    expect(bench.hp).toBeGreaterThan(before);
  });

  it('团灭休整时长受宿舍等级减免', () => {
    const s = freshState();
    s.roster[0].hp = 1;
    spawnWave(s, fakeRng([0.01, 0.99, 0, 0.5, 0.5])); // 强 BOSS 波秒杀
    tickN(s, 1, 111); // 团灭
    expect(s.dungeon.status).toBe('resting');
    expect(s.dungeon.restRemainingS).toBe(BALANCE.REST_AFTER_WIPE_S);
    s.tavern.dorm = 5; // -50%
    s.roster[0].hp = 1;
    spawnWave(s, fakeRng([0.01, 0.99, 0, 0.5, 0.5]));
    tickN(s, 1, 111);
    expect(s.dungeon.restRemainingS).toBe(Math.ceil(BALANCE.REST_AFTER_WIPE_S * 0.5));
  });
});

describe('战斗事件流', () => {
  it('波次启动产生 waveStart；战斗产生双方 hit 与击杀/清波事件', () => {
    const s = freshState();
    tickN(s, 2, 21); // 第 1 秒生成首波
    const start = s.events.find((e) => e.kind === 'waveStart');
    expect(start).toBeDefined();
    expect(start).toMatchObject({ kind: 'waveStart', wave: 1 });

    tickN(s, 60, 21);
    const hits = s.events.filter((e) => e.kind === 'hit');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((e) => e.attackerSide === 'party')).toBe(true);
    expect(hits.some((e) => e.attackerSide === 'monster')).toBe(true);
    expect(s.events.some((e) => e.kind === 'death' && e.side === 'monster')).toBe(true);
    expect(s.events.some((e) => e.kind === 'waveClear')).toBe(true);
  });

  it('hit 事件载荷：伤害数值与目标标识', () => {
    const s = freshState();
    tickN(s, 5, 33);
    const hit = s.events.find((e) => e.kind === 'hit' && e.attackerSide === 'party');
    expect(hit).toBeDefined();
    if (hit && hit.kind === 'hit' && hit.attackerSide === 'party') {
      expect(hit.attackerId).toBe('adv_hank');
      expect(hit.damage).toBeGreaterThan(0);
      expect(typeof hit.crit).toBe('boolean');
    }
  });

  it('牧师治疗 / 团灭 / 复活事件', () => {
    const s = freshState();
    const warrior = makeAdventurer('w1', 'warrior', 5);
    const priest = makeAdventurer('p1', 'priest', 5);
    setupParty(s, [warrior, priest]);
    warrior.hp = Math.floor(getAdventurerStats(s, warrior).hp * 0.3);
    tickN(s, 2, 31);
    expect(s.events.some((e) => e.kind === 'heal')).toBe(true);

    const s2 = freshState();
    s2.roster[0].hp = 1;
    spawnWave(s2, fakeRng([0.01, 0.99, 0, 0.5, 0.5])); // 强 BOSS 波
    tickN(s2, 1, 111);
    expect(s2.dungeon.status).toBe('resting');
    expect(s2.events.some((e) => e.kind === 'wipe')).toBe(true);
    tickN(s2, BALANCE.REST_AFTER_WIPE_S, 111);
    expect(s2.events.some((e) => e.kind === 'revive')).toBe(true);
  });

  it('事件环缓冲不超上限（长离线也不爆）', () => {
    const s = freshState();
    applyOffline(s, 3 * 3600, { rng: mulberry32(9) });
    expect(s.events.length).toBeLessThanOrEqual(BALANCE.EVENT_LIMIT);
    expect(s.events.length).toBeGreaterThan(0);
  });
});

describe('离线结算', () => {
  it('离线 = 同路径 tick × 效率折算（一致性保证）', () => {
    const a = freshState();
    const b = freshState();
    applyOffline(a, 600, { rng: mulberry32(7) });
    tick(b, 600, { offline: true, rng: mulberry32(7) });
    expect(a.player.gold).toBe(b.player.gold);
    expect(a.roster[0].level).toBe(b.roster[0].level);
    expect(a.inventory).toEqual(b.inventory);
    expect(a.meta.totalWavesCleared).toBe(b.meta.totalWavesCleared);
  });

  it('离线收益低于在线（效率折算）', () => {
    const on = freshState();
    const off = freshState();
    tick(on, 300, { rng: mulberry32(7) });
    applyOffline(off, 300, { rng: mulberry32(7) });
    expect(off.meta.lifetimeGoldEarned).toBeLessThan(on.meta.lifetimeGoldEarned);
  });

  it('超过 CAP 按 8 小时封顶', () => {
    const s = freshState();
    const r = applyOffline(s, 100 * 3600, { rng: mulberry32(9) });
    expect(r.report?.appliedSeconds).toBe(BALANCE.OFFLINE_CAP_S);
  });

  it('时钟回拨 → 不结算并标记', () => {
    const s = freshState();
    const gold0 = s.player.gold;
    const r = applyOffline(s, -50);
    expect(r.clockTampered).toBe(true);
    expect(r.report).toBeNull();
    expect(s.player.gold).toBe(gold0);
  });

  it('离线 3 小时：到访批次照常生成', () => {
    const s = freshState();
    applyOffline(s, 3 * 3600, { rng: mulberry32(13) });
    expect(s.recruitment.visitors.length).toBe(BALANCE.VISIT_BATCH_BASE);
  });
});

describe('欢迎回来弹窗稳定性', () => {
  it('已有待确认报告时，catchUp 不得清空或替换它（闪没修复）', () => {
    const s = freshState();
    setStoreState(s);
    useGameStore.getState().catchUp(300);
    const first = useGameStore.getState().offlineReport;
    expect(first).not.toBeNull();
    useGameStore.getState().catchUp(90);
    expect(useGameStore.getState().offlineReport).toEqual(first);
  });
});

describe('设施升级（store）', () => {
  it('upgradeFacility：扣费升级（招待区 80 金 + 4 甲壳）', () => {
    const s = freshState();
    s.player.gold = 500;
    s.inventory['mat_carapace'] = 10;
    setStoreState(s);
    const r = useGameStore.getState().upgradeFacility('lounge');
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.tavern.lounge).toBe(1);
    expect(after.player.gold).toBe(500 - 80);
    expect(after.inventory['mat_carapace']).toBe(10 - 4);
  });

  it('已下架设施（训练场/情报网）：拒绝升级，旧档字段与加成原样保留', () => {
    const s = freshState();
    s.tavern.trainingGround = 2; // 旧档遗留等级（全属性 +16%）
    setStoreState(s);
    const tg = useGameStore.getState().upgradeFacility('trainingGround');
    expect(tg.ok).toBe(false);
    expect(tg.message).toContain('未知设施');
    expect(useGameStore.getState().upgradeFacility('intel').ok).toBe(false);
    // 存档字段不被清除/篡改
    expect(useGameStore.getState().state.tavern.trainingGround).toBe(2);
  });
});

describe('首次团灭应急资助（v6）', () => {
  /** 确定性团灭：编队成员 hp=0 直接进入战斗回合 → 立即 onWiped（无战斗收入，便于精确断言） */
  function forceWipe(s: GameState): void {
    s.roster[0].hp = 0;
    s.dungeon.status = 'combat';
  }

  it('首次团灭：发放金币+签约材料，标记已领，无客时立刻安排到访', () => {
    const t0 = 1_700_000_000_000;
    const s = createInitialState(t0);
    forceWipe(s);
    tickN(s, 1, 111);
    expect(s.dungeon.status).toBe('resting');
    expect(s.meta.wipeSubsidyClaimed).toBe(true);
    // 初始 60 金 + 拨款 200（无战斗击杀，精确值）
    expect(s.player.gold).toBe(60 + BALANCE.WIPE_SUBSIDY_GOLD);
    expect(s.inventory['mat_carapace']).toBe(BALANCE.WIPE_SUBSIDY_MATERIALS.mat_carapace);
    // 无客到访 → 下一批提前到 60 秒内（初始为 t0+180s，被提前到 t0+1s+60s）
    expect(s.recruitment.nextVisitAt).toBe(t0 + 1000 + BALANCE.WIPE_SUBSIDY_VISIT_DELAY_MS);
    expect(s.log.some((l) => l.text.includes('理事会'))).toBe(true);
  });

  it('已有客到访时不提前批次（引导直接可完成）', () => {
    const t0 = 1_700_000_000_000;
    const s = createInitialState(t0);
    s.recruitment.visitors = [
      {
        uid: 9001,
        name: '测试访客',
        classId: 'warrior',
        race: 'human',
        level: 1,
        costGold: 30,
        costMaterial: { materialId: 'mat_carapace', count: 3 },
      },
    ];
    forceWipe(s);
    tickN(s, 1, 111);
    expect(s.meta.wipeSubsidyClaimed).toBe(true);
    expect(s.recruitment.nextVisitAt).toBe(t0 + 180_000); // 保持原批次计划
    expect(s.recruitment.visitors).toHaveLength(1); // 访客未被替换
  });

  it('二次团灭不重复发放', () => {
    const s = freshState();
    forceWipe(s);
    tickN(s, 1, 111);
    const goldAfterFirst = s.player.gold;
    const carapaceAfterFirst = s.inventory['mat_carapace'];
    forceWipe(s);
    tickN(s, 1, 111);
    expect(s.player.gold).toBe(goldAfterFirst);
    expect(s.inventory['mat_carapace']).toBe(carapaceAfterFirst);
    expect(s.log.filter((l) => l.text.includes('理事会'))).toHaveLength(1);
  });

  it('store.tick 捕捉资助跃迁 → 打开引导弹窗；关闭后不再弹出', () => {
    const s = freshState();
    forceWipe(s);
    setStoreState(s);
    expect(useGameStore.getState().firstWipeGuideOpen).toBe(false);
    useGameStore.getState().tick(1);
    expect(useGameStore.getState().firstWipeGuideOpen).toBe(true);
    useGameStore.getState().dismissFirstWipeGuide();
    useGameStore.getState().tick(1);
    expect(useGameStore.getState().firstWipeGuideOpen).toBe(false);
  });

  it('store.catchUp（离线路径团灭）同样打开引导弹窗', () => {
    const s = freshState();
    forceWipe(s);
    setStoreState(s);
    useGameStore.getState().catchUp(2);
    expect(useGameStore.getState().firstWipeGuideOpen).toBe(true);
  });
});

describe('数值工具', () => {
  it('经验曲线单调递增', () => {
    for (let lv = 1; lv < 9; lv++) {
      expect(expToNext(lv + 1)).toBeGreaterThan(expToNext(lv));
    }
  });

  it('fmtNum 大数缩写', () => {
    expect(fmtNum(999)).toBe('999');
    expect(fmtNum(1500)).toBe('1.5K');
    expect(fmtNum(1234567)).toBe('1.2M');
  });
});

describe('精灵贴图完整性', () => {
  it('53 种魔物与 6 职业全部有贴图文件（无 emoji 回退）', () => {
    const root = join(process.cwd(), 'public', 'sprites');
    expect(Object.keys(MONSTER_SPRITES)).toHaveLength(Object.keys(MONSTERS).length);
    for (const [id, file] of Object.entries(MONSTER_SPRITES)) {
      expect(existsSync(join(root, 'monsters', file)), `${id} -> ${file}`).toBe(true);
    }
    for (const [id, file] of Object.entries(CLASS_SPRITES)) {
      expect(existsSync(join(root, 'classes', file)), `${id} -> ${file}`).toBe(true);
    }
  });

  it('每张地图 ≥2 个地板变体且文件存在（基底+点缀混铺）', () => {
    const root = join(process.cwd(), 'public', 'sprites', 'tiles');
    for (const m of MAP_DEFS) {
      expect(m.floorSprites.length, `${m.id} 地板变体数`).toBeGreaterThanOrEqual(2);
      for (const f of m.floorSprites) {
        expect(existsSync(join(root, f)), `${m.id} -> ${f}`).toBe(true);
      }
    }
  });
});
