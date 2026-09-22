import { describe, expect, it } from 'vitest';
import { createInitialState } from '../src/engine/initialState';
import { tick } from '../src/engine/tick';
import { applyOffline } from '../src/engine/offline';
import { spawnWave } from '../src/engine/combat';
import { adventurerLevelCap, expToNext, getEffectiveStats } from '../src/engine/stats';
import { mulberry32 } from '../src/engine/rng';
import { serialize, deserialize } from '../src/save/migrate';
import { useGameStore } from '../src/store/gameStore';
import { RECIPES } from '../src/data/recipes';
import { BALANCE } from '../src/data/balance';
import { MATERIALS } from '../src/data/materials';
import { fmtNum } from '../src/utils/format';
import { SAVE_VERSION } from '../src/engine/types';
import type { GameState } from '../src/engine/types';

/** 固定时间戳的新档，保证测试可重复 */
function freshState(): GameState {
  return createInitialState(1_700_000_000_000);
}

/** 确定性推进（每次调用重置种子，测试内固定即可复现） */
function tickN(s: GameState, seconds: number, seed = 7, offline = false): void {
  tick(s, seconds, { rng: mulberry32(seed), offline });
}

/** 冻结战斗（用于隔离测试烹饪/buff 等非战斗系统） */
function freezeCombat(s: GameState): void {
  s.dungeon.status = 'resting';
  s.dungeon.restRemainingS = 10 ** 9;
}

// ────────────────────────────────────────────

describe('初始状态', () => {
  it('满血、第 1 波已生成、日志就绪、版本号正确', () => {
    const s = freshState();
    expect(s.adventurer.hp).toBe(getEffectiveStats(s).hp);
    expect(s.dungeon.status).toBe('combat');
    expect(s.dungeon.monsters.length).toBe(2); // 第 1 波：2 史莱姆
    expect(s.log.length).toBeGreaterThan(0);
    expect(s.version).toBe(SAVE_VERSION);
    expect(s.player.gold).toBe(20);
  });
});

describe('战斗模拟', () => {
  it('tick 推进后魔物掉血且金币不减', () => {
    const s = freshState();
    const gold0 = s.player.gold;
    tickN(s, 5, 42);
    const changed =
      s.dungeon.monsters.some((m) => m.hp < m.maxHp) || s.dungeon.monsters.length !== 2;
    expect(changed).toBe(true);
    expect(s.player.gold).toBeGreaterThanOrEqual(gold0);
  });

  it('500 秒压力：掉落全在掉落表内、有清波、有升级', () => {
    const s = freshState();
    tickN(s, 500, 7);
    const valid = new Set(Object.keys(MATERIALS));
    for (const k of Object.keys(s.inventory)) {
      expect(valid.has(k)).toBe(true);
      expect(s.inventory[k]).toBeGreaterThan(0);
    }
    expect(s.meta.totalWavesCleared).toBeGreaterThan(0);
    expect(s.adventurer.level).toBeGreaterThan(1);
  });

  it('日志环形缓冲不超过上限', () => {
    const s = freshState();
    tickN(s, 500, 7);
    expect(s.log.length).toBeLessThanOrEqual(BALANCE.LOG_LIMIT);
  });
});

describe('BOSS 首杀与驻 farm 循环', () => {
  it('首杀层底 BOSS 加声望，复杀不再加', () => {
    const s = freshState();
    s.adventurer.level = 30;
    s.adventurer.hp = getEffectiveStats(s).hp;
    s.dungeon.waveIndex = 4;
    spawnWave(s); // BOSS 波
    tickN(s, 5, 3); // 高等级 2 回合内击杀 + 3s 休整
    expect(s.meta.totalBossKills).toBe(1);
    expect(s.player.reputation).toBe(5);
    expect(s.meta.bossFirstCleared).toBe(true);

    // 第二轮 farm：不再重复加声望
    s.adventurer.hp = getEffectiveStats(s).hp;
    s.dungeon.waveIndex = 4;
    spawnWave(s);
    tickN(s, 5, 3);
    expect(s.meta.totalBossKills).toBe(2);
    expect(s.player.reputation).toBe(5);
  });

  it('通关后波次回绕到第 1 波', () => {
    const s = freshState();
    s.adventurer.level = 30;
    s.adventurer.hp = getEffectiveStats(s).hp;
    s.dungeon.waveIndex = 4;
    spawnWave(s);
    tickN(s, 5, 3); // 击杀 BOSS + 休整 + 生成新波次
    expect(s.dungeon.waveIndex).toBe(0);
    expect(s.dungeon.status).toBe('combat');
    expect(s.dungeon.monsters.length).toBe(2);
  });
});

describe('团灭与休整', () => {
  it('团灭进入休整，休整结束满血复活', () => {
    const s = freshState();
    s.dungeon.waveIndex = 4;
    spawnWave(s); // BOSS
    s.adventurer.hp = 1;
    tickN(s, 1, 11); // 勇者先手打 BOSS，BOSS 反击致团灭
    expect(s.adventurer.hp).toBe(0);
    expect(s.dungeon.status).toBe('resting');
    expect(s.dungeon.restRemainingS).toBe(BALANCE.REST_AFTER_WIPE_S); // 团灭当 tick 不倒计时

    tickN(s, BALANCE.REST_AFTER_WIPE_S, 11);
    expect(s.dungeon.status).toBe('combat');
    expect(s.dungeon.waveIndex).toBe(0);
    expect(s.adventurer.hp).toBe(getEffectiveStats(s).hp);
  });
});

describe('等级与上限', () => {
  it('达到等级上限后经验冻结；训练场升级解除上限', () => {
    const s = freshState();
    s.adventurer.level = 10; // 训练场 0 级 → 上限 10
    s.adventurer.exp = 0;
    s.adventurer.hp = getEffectiveStats(s).hp;
    expect(adventurerLevelCap(s.tavern.trainingGround)).toBe(10);
    tickN(s, 30, 31);
    expect(s.adventurer.level).toBe(10);
    expect(s.adventurer.exp).toBe(0);

    s.tavern.trainingGround = 1; // 上限 15
    tickN(s, 300, 31);
    expect(s.adventurer.level).toBeGreaterThan(10);
  });
});

describe('烹饪与菜肴 buff', () => {
  it('烹饪完成 → buff 生效 + 忠诚度；到期 → 消散', () => {
    const s = freshState();
    freezeCombat(s);
    const recipe = RECIPES.recipe_gel_soup;
    s.kitchen.job = { recipeId: recipe.id, remainingS: 2, totalS: recipe.cookTimeS };
    const loyalty0 = s.adventurer.loyalty;
    const atk0 = getEffectiveStats(s).atk;

    tickN(s, 2, 21);
    expect(s.kitchen.job).toBeNull();
    expect(s.kitchen.buffs.length).toBe(1);
    expect(getEffectiveStats(s).atk).toBeGreaterThan(atk0); // ATK +25%
    expect(s.adventurer.loyalty).toBe(Math.min(100, loyalty0 + recipe.mealLoyalty));

    tickN(s, recipe.buff.durationS + 2, 21);
    expect(s.kitchen.buffs.length).toBe(0);
    expect(getEffectiveStats(s).atk).toBe(atk0); // buff 消失后回到基线
  });

  it('离线期间烹饪照常推进（不受效率折算）', () => {
    const s = freshState();
    freezeCombat(s);
    s.kitchen.job = { recipeId: 'recipe_gel_soup', remainingS: 10, totalS: 90 };
    applyOffline(s, 30, { rng: mulberry32(4) });
    expect(s.kitchen.job).toBeNull();
    expect(s.kitchen.buffs.length).toBe(1);
  });
});

describe('离线结算', () => {
  it('离线 = 同路径 tick × 效率折算（一致性保证）', () => {
    const a = freshState();
    const b = freshState();
    applyOffline(a, 600, { rng: mulberry32(7) });
    tick(b, 600, { offline: true, rng: mulberry32(7) });
    expect(a.player.gold).toBe(b.player.gold);
    expect(a.adventurer.level).toBe(b.adventurer.level);
    expect(a.adventurer.exp).toBe(b.adventurer.exp);
    expect(a.inventory).toEqual(b.inventory);
    expect(a.meta.totalWavesCleared).toBe(b.meta.totalWavesCleared);
    expect(a.meta.totalBossKills).toBe(b.meta.totalBossKills);
  });

  it('离线收益低于在线（效率折算生效）', () => {
    const on = freshState();
    const off = freshState();
    tick(on, 300, { rng: mulberry32(7) });
    applyOffline(off, 300, { rng: mulberry32(7) });
    expect(off.meta.lifetimeGoldEarned).toBeLessThan(on.meta.lifetimeGoldEarned);
    expect(off.meta.lifetimeExpEarned).toBeLessThan(on.meta.lifetimeExpEarned);
  });

  it('超过 CAP 按 8 小时封顶结算', () => {
    const s = freshState();
    const r = applyOffline(s, 100 * 3600, { rng: mulberry32(9) });
    expect(r.report?.appliedSeconds).toBe(BALANCE.OFFLINE_CAP_S);
  });

  it('时钟回拨 → 不结算并标记 clockTampered', () => {
    const s = freshState();
    const gold0 = s.player.gold;
    const r = applyOffline(s, -50);
    expect(r.clockTampered).toBe(true);
    expect(r.report).toBeNull();
    expect(s.player.gold).toBe(gold0);
  });

  it('报告字段完整（欢迎回来弹窗数据源）', () => {
    const s = freshState();
    const r = applyOffline(s, 300, { rng: mulberry32(7) });
    expect(r.report).not.toBeNull();
    expect(r.report!.awaySeconds).toBe(300);
    expect(r.report!.appliedSeconds).toBe(300);
    expect(r.report!.efficiency).toBe(BALANCE.OFFLINE_EFFICIENCY);
    expect(r.report!.gold).toBeGreaterThan(0);
    expect(r.report!.levelsGained).toBeGreaterThanOrEqual(0);
  });
});

describe('store 动作', () => {
  function setStoreState(s: GameState): void {
    useGameStore.setState({ state: s, offlineReport: null, clockWarning: false });
  }

  it('cook：材料不足拒绝；充足时扣费开工；烹饪中占用灶台', () => {
    const s = freshState();
    setStoreState(s);
    // 初始金币 20 够，但凝胶 0 → 拒绝
    let r = useGameStore.getState().cook('recipe_gel_soup');
    expect(r.ok).toBe(false);

    useGameStore.getState().state.inventory.mat_gel = 5;
    r = useGameStore.getState().cook('recipe_gel_soup');
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.player.gold).toBe(20 - 10);
    expect(after.inventory.mat_gel).toBe(2);
    expect(after.kitchen.job?.recipeId).toBe('recipe_gel_soup');

    // 灶台占用中再点 → 拒绝
    r = useGameStore.getState().cook('recipe_gel_soup');
    expect(r.ok).toBe(false);
  });

  it('upgradeTrainingGround：扣费升级、属性与上限提升', () => {
    const s = freshState();
    s.inventory.mat_carapace = 3;
    s.player.gold = 100;
    setStoreState(s);
    const stats0 = getEffectiveStats(s);
    const r = useGameStore.getState().upgradeTrainingGround();
    expect(r.ok).toBe(true);
    const after = useGameStore.getState().state;
    expect(after.tavern.trainingGround).toBe(1);
    expect(after.player.gold).toBe(50); // 100 - 50
    expect(after.inventory.mat_carapace).toBe(0);
    expect(getEffectiveStats(after).atk).toBeGreaterThan(stats0.atk); // +8%
    expect(adventurerLevelCap(after.tavern.trainingGround)).toBe(15);
  });

  it('hardReset：回到新档', () => {
    const s = freshState();
    s.player.gold = 999;
    setStoreState(s);
    useGameStore.getState().hardReset();
    expect(useGameStore.getState().state.player.gold).toBe(20);
  });
});

describe('存档序列化', () => {
  it('serialize → deserialize 往返一致', () => {
    const s = freshState();
    tickN(s, 60, 5);
    const round = deserialize(serialize(s));
    expect(round).not.toBeNull();
    expect(round).toEqual(s);
  });

  it('非法存档被拒绝', () => {
    expect(deserialize('not json')).toBeNull();
    expect(deserialize(JSON.stringify({ magic: 'wrong', version: 1, state: {} }))).toBeNull();
    expect(deserialize(JSON.stringify({ magic: 'monster-tavern-save', version: 1 }))).toBeNull();
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
