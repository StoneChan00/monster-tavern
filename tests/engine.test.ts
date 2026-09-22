import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/engine/initialState';
import { tick } from '../src/engine/tick';
import { applyOffline } from '../src/engine/offline';
import { spawnWave } from '../src/engine/combat';
import { classWeights, generateVisitors } from '../src/engine/recruitment';
import { adventurerLevelCap, expToNext, getAdventurerStats, getPartyDropMult } from '../src/engine/stats';
import { rollDropsWithBonus } from '../src/engine/drops';
import { mulberry32 } from '../src/engine/rng';
import { serialize, deserialize } from '../src/save/migrate';
import { useGameStore } from '../src/store/gameStore';
import { BALANCE, rosterCap } from '../src/data/balance';
import { FLOOR_DEFS, MONSTERS } from '../src/data/monsters';
import { RECIPES } from '../src/data/recipes';
import { MATERIALS } from '../src/data/materials';
import { RACES } from '../src/data/races';
import { fmtNum } from '../src/utils/format';
import { SAVE_VERSION } from '../src/engine/types';
import type { AdventurerState, GameState, OfflineReport } from '../src/engine/types';

/** 固定时间戳的新档，保证测试可重复 */
function freshState(): GameState {
  return createInitialState(1_700_000_000_000);
}

function makeAdventurer(id: string, classId: string, level = 5, race = 'human'): AdventurerState {
  return { id, name: id, classId, race, rarity: 'common', level, exp: 0, hp: 1, loyalty: 50 };
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
  useGameStore.setState({ state: s, offlineReport: null, clockWarning: false });
}

// ────────────────────────────────────────────

describe('初始状态 v2', () => {
  it('开局：汉克 + 单人编队 + 2 道初始菜谱 + 60 金币', () => {
    const s = freshState();
    expect(s.roster.length).toBe(1);
    expect(s.roster[0].name).toBe('铁胃汉克');
    expect(s.party[0]).toBe('adv_hank');
    expect(s.party.slice(1).every((x) => x === null)).toBe(true);
    expect(s.dungeon.highestFloor).toBe(1);
    expect(s.dungeon.farmFloor).toBe(1);
    expect(s.kitchen.unlockedRecipes).toContain('recipe_gel_soup');
    expect(s.kitchen.unlockedRecipes).toContain('recipe_bat_wings');
    expect(s.player.gold).toBe(60);
    expect(s.version).toBe(SAVE_VERSION);
  });
});

describe('存档迁移链（v1 → v3）', () => {
  it('Phase 0 存档完整升级：进度保留、种族补齐', () => {
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
    expect(loaded!.version).toBe(3);
    expect(loaded!.roster[0].name).toBe('铁胃汉克');
    expect(loaded!.roster[0].level).toBe(4);
    expect(loaded!.roster[0].race).toBe('human'); // v3 补种族
    expect(loaded!.party[0]).toBe('adv_hank');
    expect(loaded!.tavern.trainingGround).toBe(2);
    expect(loaded!.tavern.lounge).toBe(0);
    expect(loaded!.dungeon.highestFloor).toBe(1);
    expect(loaded!.dungeon.farmFloor).toBe(1);
    expect(loaded!.meta.floorsFirstCleared).toEqual(['floor_1']);
    expect(loaded!.kitchen.unlockedRecipes).toContain('recipe_bat_wings'); // 新初始菜谱补发
    expect(loaded!.inventory['mat_gel']).toBe(7);
    expect(loaded!.player.reputation).toBe(5);
  });

  it('v2 存档（Phase 1）升级 v3：全员补 human 种族', () => {
    const s = freshState();
    const v2Like = JSON.parse(JSON.stringify(s)) as Record<string, unknown> & {
      roster: Array<Record<string, unknown>>;
      recruitment: { visitors: Array<Record<string, unknown>> };
    };
    v2Like.version = 2;
    for (const a of v2Like.roster) delete a.race;
    for (const v of v2Like.recruitment.visitors) delete v.race;
    const raw = JSON.stringify({ magic: 'monster-tavern-save', version: 2, state: v2Like, exportedAt: 1 });
    const loaded = deserialize(raw);
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(3);
    expect(loaded!.roster[0].race).toBe('human');
  });

  it('serialize → deserialize 往返一致（v2，瞬态事件剥离）', () => {
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
    expect(deserialize(JSON.stringify({ magic: 'wrong', version: 2, state: {} }))).toBeNull();
    expect(deserialize(JSON.stringify({ magic: 'monster-tavern-save', version: 2 }))).toBeNull();
  });
});

describe('多单位战斗', () => {
  it('三人队（战/法/牧）能推进多层波次', () => {
    const s = freshState();
    setupParty(s, [makeAdventurer('w1', 'warrior', 12), makeAdventurer('m1', 'mage', 12), makeAdventurer('p1', 'priest', 12)]);
    tickN(s, 60, 11);
    expect(s.meta.totalWavesCleared).toBeGreaterThan(0);
    expect(s.roster.every((a) => a.hp > 0)).toBe(true); // 三人全部存活
  });

  it('法师 AOE：一回合内命中所有存活魔物', () => {
    const s = freshState();
    setupParty(s, [makeAdventurer('m1', 'mage', 10)]);
    tickN(s, 1, 21);
    const damaged = s.dungeon.monsters.filter((m) => m.hp < m.maxHp).length;
    expect(damaged).toBe(s.dungeon.monsters.length); // 第 1 波全体（2 史莱姆）
  });

  it('牧师：优先治疗伤势最重的队友', () => {
    const s = freshState();
    const warrior = makeAdventurer('w1', 'warrior', 5);
    const priest = makeAdventurer('p1', 'priest', 10);
    setupParty(s, [warrior, priest]);
    warrior.hp = Math.floor(getAdventurerStats(s, warrior).hp * 0.3);
    const before = warrior.hp;
    tickN(s, 1, 31);
    expect(warrior.hp).toBeGreaterThan(before);
  });

  it('魔物优先攻击前排，后排受到保护', () => {
    const s = freshState();
    const warrior = makeAdventurer('w1', 'warrior', 3);
    const mage = makeAdventurer('m1', 'mage', 3);
    setupParty(s, [warrior, mage]); // 槽位 0=前排战士，槽位 1=中排法师
    // 放大魔物伤害以快速观察到目标选择：把汉克 def 降到 0（取巧：直接观察多回合后战士承伤更多）
    const dmgWarriorBefore = s.log.filter((l) => l.text.includes('对 w1')).length;
    const dmgMageBefore = s.log.filter((l) => l.text.includes('对 m1')).length;
    tickN(s, 12, 41);
    const dmgWarrior = s.log.filter((l) => l.text.includes('对 w1')).length - dmgWarriorBefore;
    const dmgMage = s.log.filter((l) => l.text.includes('对 m1')).length - dmgMageBefore;
    expect(dmgWarrior).toBeGreaterThan(0);
    expect(dmgMage).toBe(0); // 前排存活时，魔物不攻击中排
  });

  it('空编队：地牢暂停，不触发团灭', () => {
    const s = freshState();
    s.party = [null, null, null, null, null];
    tickN(s, 10, 51);
    expect(s.dungeon.status).toBe('combat');
    expect(s.dungeon.monsters[0].hp).toBe(s.dungeon.monsters[0].maxHp);
  });
});

describe('羁绊与光环', () => {
  it('坚守（战士+牧师）：全队 DEF +10%', () => {
    const solo = freshState();
    const w1 = makeAdventurer('w1', 'warrior', 8);
    setupParty(solo, [w1]);
    const duo = freshState();
    const w2 = makeAdventurer('w2', 'warrior', 8);
    const p2 = makeAdventurer('p2', 'priest', 8);
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

describe('推层与 farm', () => {
  it('首杀层底 BOSS：声望一次性 + 解锁下一层', () => {
    const s = freshState();
    s.roster[0].level = 30;
    s.roster[0].hp = getAdventurerStats(s, s.roster[0]).hp;
    s.dungeon.waveIndex = 4;
    spawnWave(s);
    tickN(s, 5, 3);
    expect(s.meta.totalBossKills).toBe(1);
    expect(s.player.reputation).toBe(5);
    expect(s.dungeon.highestFloor).toBe(2);
    expect(s.meta.floorsFirstCleared).toContain('floor_1');

    // 复杀不加声望
    s.roster[0].hp = getAdventurerStats(s, s.roster[0]).hp;
    s.dungeon.waveIndex = 4;
    spawnWave(s);
    tickN(s, 5, 3);
    expect(s.meta.totalBossKills).toBe(2);
    expect(s.player.reputation).toBe(5);
  });

  it('setFarmFloor：合法切换生效，越界拒绝', () => {
    const s = freshState();
    s.dungeon.highestFloor = 3;
    setStoreState(s);
    const ok = useGameStore.getState().setFarmFloor(2);
    expect(ok.ok).toBe(true);
    expect(useGameStore.getState().state.dungeon.farmFloor).toBe(2);
    expect(useGameStore.getState().state.dungeon.floorId).toBe('floor_2');
    const bad = useGameStore.getState().setFarmFloor(4);
    expect(bad.ok).toBe(false);
  });
});

describe('招募到访与签约', () => {
  it('到访时间到达后生成一批访客（模拟时钟驱动）', () => {
    const s = freshState();
    s.recruitment.nextVisitAt = s.meta.now + 1000;
    tickN(s, 2, 61);
    expect(s.recruitment.visitors.length).toBe(BALANCE.VISIT_BATCH_BASE);
  });

  it('已解锁菜谱提升对应职业的到访权重', () => {
    const s = freshState();
    const before = classWeights(s);
    s.kitchen.unlockedRecipes.push('recipe_beast_roast'); // 吸引战士/游侠
    const after = classWeights(s);
    expect(after.get('warrior')).toBeGreaterThan(before.get('warrior')!);
    expect(after.get('mage')).toBe(before.get('mage')!);
  });

  it('store.signVisitor：扣费、入队、占用上限', () => {
    const s = freshState();
    s.recruitment.visitors = generateVisitors(s, mulberry32(5));
    const v = s.recruitment.visitors[0];
    s.player.gold = 9999;
    s.inventory[v.costMaterial.materialId] = 99;
    setStoreState(s);
    const r = useGameStore.getState().signVisitor(v.uid);
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.roster.length).toBe(2);
    expect(after.recruitment.visitors.length).toBe(1);
    // 满员后拒绝
    while (after.roster.length < rosterCap(after.tavern.lounge)) {
      const extra = makeAdventurer(`filler_${after.roster.length}`, 'warrior', 1);
      after.roster.push(extra);
    }
    after.player.gold = 9999;
    after.inventory['mat_carapace'] = 999;
    after.inventory['mat_mithril'] = 999;
    after.inventory['mat_core'] = 999;
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

describe('日薪与忠诚度', () => {
  function advanceOneDay(s: GameState): void {
    const day = Math.floor(s.meta.now / BALANCE.DAY_MS);
    s.meta.now = (day + 1) * BALANCE.DAY_MS + 1000;
    s.recruitment.lastWageDay = day;
    tickN(s, 1, 71);
  }

  it('正常支付：金币扣除', () => {
    const s = freshState();
    const gold0 = s.player.gold;
    advanceOneDay(s);
    expect(s.player.gold).toBe(gold0 - BALANCE.WAGE_PER_RARITY[0]); // 汉克=普通
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

describe('菜谱与厨房', () => {
  it('烹饪完成 → buff 生效 + 全员忠诚；到期消散', () => {
    const s = freshState();
    freezeCombat(s);
    const recipe = RECIPES.recipe_gel_soup!;
    s.kitchen.job = { recipeId: recipe.id, remainingS: 2, totalS: recipe.cookTimeS };
    const loyalty0 = s.roster[0].loyalty;
    const atk0 = getAdventurerStats(s, s.roster[0]).atk;
    tickN(s, 2, 81);
    expect(s.kitchen.job).toBeNull();
    expect(s.kitchen.buffs.length).toBe(1);
    expect(getAdventurerStats(s, s.roster[0]).atk).toBeGreaterThan(atk0);
    expect(s.roster[0].loyalty).toBe(Math.min(100, loyalty0 + recipe.mealLoyalty));
    tickN(s, recipe.buff.durationS + 2, 81);
    expect(s.kitchen.buffs.length).toBe(0);
    expect(getAdventurerStats(s, s.roster[0]).atk).toBe(atk0);
  });

  it('厨房等级 0 → 同时生效上限 1 道，旧效果下架', () => {
    const s = freshState();
    freezeCombat(s);
    expect(s.tavern.kitchen).toBe(0);
    s.kitchen.job = { recipeId: 'recipe_gel_soup', remainingS: 1, totalS: 600 };
    tickN(s, 1, 82);
    expect(s.kitchen.buffs.length).toBe(1);
    s.kitchen.job = { recipeId: 'recipe_mushroom_soup', remainingS: 1, totalS: 900 };
    tickN(s, 1, 82);
    expect(s.kitchen.buffs.length).toBe(1);
    expect(s.kitchen.buffs[0].recipeId).toBe('recipe_mushroom_soup');
  });

  it('通关楼层解锁对应菜谱', () => {
    const s = freshState();
    s.meta.floorsFirstCleared = ['floor_1', 'floor_2'];
    tickN(s, 1, 83);
    expect(s.kitchen.unlockedRecipes).toContain('recipe_carapace_chips');
  });
});

describe('经验与等级', () => {
  it('达到上限冻结；训练场升级解除', () => {
    const s = freshState();
    s.roster[0].level = 10;
    s.roster[0].exp = 0;
    s.roster[0].hp = getAdventurerStats(s, s.roster[0]).hp;
    expect(adventurerLevelCap(s.tavern.trainingGround)).toBe(10);
    tickN(s, 30, 91);
    expect(s.roster[0].level).toBe(10);
    expect(s.roster[0].exp).toBe(0);
    s.tavern.trainingGround = 1;
    tickN(s, 300, 91);
    expect(s.roster[0].level).toBeGreaterThan(10);
  });

  it('经验菜肴 buff 放大击杀经验', () => {
    const a = freshState();
    const b = freshState();
    b.kitchen.buffs.push({
      recipeId: 'recipe_mush_wine',
      label: '经验获取 +30%',
      stat: 'expGain',
      mult: 1.3,
      remainingS: 9999,
      totalS: 9999,
    });
    tickN(a, 4, 95);
    tickN(b, 4, 95);
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
    setupParty(s, [makeAdventurer('w1', 'warrior', 15)]);
    tickN(s, 500, 7);
    const valid = new Set(Object.keys(MATERIALS));
    for (const k of Object.keys(s.inventory)) {
      expect(valid.has(k)).toBe(true);
    }
    expect(s.log.length).toBeLessThanOrEqual(BALANCE.LOG_LIMIT);
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

  it('20 层楼层链完整：每层 5 波、末波 BOSS、魔物已注册、强度递增', () => {
    expect(FLOOR_DEFS).toHaveLength(20);
    let prevBossHp = 0;
    for (const f of FLOOR_DEFS) {
      expect(f.waves).toHaveLength(5);
      expect(f.waves[4]!.isBoss).toBe(true);
      for (const w of f.waves) {
        for (const mid of w.monsters) {
          expect(MONSTERS[mid]).toBeDefined();
        }
      }
      const bossId = f.waves[4]!.monsters[0]!;
      const bossHp = MONSTERS[bossId]!.base.hp;
      expect(bossHp).toBeGreaterThan(prevBossHp);
      prevBossHp = bossHp;
    }
    // 顶层食材可获取（虚空精华来自 16+ 层魔物）
    expect(MONSTERS.void_wraith!.drops.some((d) => d.materialId === 'mat_void_essence')).toBe(true);
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
    s.dungeon.waveIndex = 4;
    spawnWave(s);
    tickN(s, 1, 111); // 团灭
    expect(s.dungeon.status).toBe('resting');
    expect(s.dungeon.restRemainingS).toBe(BALANCE.REST_AFTER_WIPE_S);
    s.tavern.dorm = 5; // -50%
    s.roster[0].hp = 1;
    s.dungeon.waveIndex = 4;
    spawnWave(s);
    tickN(s, 1, 111);
    expect(s.dungeon.restRemainingS).toBe(Math.ceil(BALANCE.REST_AFTER_WIPE_S * 0.5));
  });
});

describe('战斗事件流', () => {
  it('开局即有 waveStart；战斗产生双方 hit 与击杀/清波事件', () => {
    const s = freshState();
    const start = s.events.find((e) => e.kind === 'waveStart');
    expect(start).toBeDefined();
    expect(start).toMatchObject({ kind: 'waveStart', wave: 1, waveCount: 5, isBoss: false });

    tickN(s, 60, 21);
    const hits = s.events.filter((e) => e.kind === 'hit');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((e) => e.attackerSide === 'party')).toBe(true);
    expect(hits.some((e) => e.attackerSide === 'monster')).toBe(true);
    expect(s.events.some((e) => e.kind === 'death' && e.side === 'monster')).toBe(true);
    expect(s.events.some((e) => e.kind === 'waveClear')).toBe(true);
    // 升级事件
    expect(s.events.some((e) => e.kind === 'levelup')).toBe(true);
  });

  it('hit 事件载荷：伤害数值与目标标识', () => {
    const s = freshState();
    tickN(s, 3, 33);
    const hit = s.events.find((e) => e.kind === 'hit' && e.attackerSide === 'party');
    expect(hit).toBeDefined();
    if (hit && hit.kind === 'hit' && hit.attackerSide === 'party') {
      expect(hit.attackerId).toBe('adv_hank');
      expect(hit.damage).toBeGreaterThan(0);
      expect(hit.targetMonsterId).toBe('slime');
      expect(typeof hit.crit).toBe('boolean');
    }
  });

  it('牧师治疗 / 团灭 / 复活事件', () => {
    const s = freshState();
    const warrior = makeAdventurer('w1', 'warrior', 5);
    const priest = makeAdventurer('p1', 'priest', 10);
    setupParty(s, [warrior, priest]);
    warrior.hp = Math.floor(getAdventurerStats(s, warrior).hp * 0.3);
    tickN(s, 1, 31);
    expect(s.events.some((e) => e.kind === 'heal')).toBe(true);

    const s2 = freshState();
    s2.roster[0].hp = 1;
    s2.dungeon.waveIndex = 4;
    spawnWave(s2);
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
  const fakeReport: OfflineReport = {
    awaySeconds: 3600,
    appliedSeconds: 3600,
    efficiency: 0.6,
    gold: 100,
    exp: 50,
    levelsGained: 1,
    materials: { mat_gel: 5 },
    wavesCleared: 10,
    bossKills: 1,
  };

  it('已有待确认报告时，catchUp 不得清空或替换它（闪没修复）', () => {
    const s = freshState();
    setStoreState(s);
    useGameStore.setState({ offlineReport: fakeReport });
    // 后台页签 61~120s 补算：旧代码会把报告清成 null
    useGameStore.getState().catchUp(90);
    expect(useGameStore.getState().offlineReport).toEqual(fakeReport);
    // 更长的隐藏（> 阈值）也保留原报告，不替换
    useGameStore.getState().catchUp(300);
    expect(useGameStore.getState().offlineReport).toEqual(fakeReport);
  });

  it('无待确认报告时：超阈值出新报告，低于阈值静默结算', () => {
    const s = freshState();
    setStoreState(s);
    useGameStore.getState().catchUp(300);
    expect(useGameStore.getState().offlineReport).not.toBeNull();
    useGameStore.getState().dismissOfflineReport();
    useGameStore.getState().catchUp(90);
    expect(useGameStore.getState().offlineReport).toBeNull();
  });
});

describe('设施升级（store）', () => {
  it('upgradeFacility：扣费升级；情报网声望门槛生效', () => {
    const s = freshState();
    s.player.gold = 500;
    s.inventory['mat_carapace'] = 10;
    setStoreState(s);
    const r = useGameStore.getState().upgradeFacility('trainingGround');
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.tavern.trainingGround).toBe(1);
    expect(after.player.gold).toBe(450);

    // 情报网需要声望 10
    const intel = useGameStore.getState().upgradeFacility('intel');
    expect(intel.ok).toBe(false);
    expect(intel.message).toContain('声望');
  });
});

describe('数值工具', () => {
  it('经验曲线单调递增', () => {
    for (let lv = 1; lv < 30; lv++) {
      expect(expToNext(lv + 1)).toBeGreaterThan(expToNext(lv));
    }
  });

  it('fmtNum 大数缩写', () => {
    expect(fmtNum(999)).toBe('999');
    expect(fmtNum(1500)).toBe('1.5K');
    expect(fmtNum(1234567)).toBe('1.2M');
  });
});
