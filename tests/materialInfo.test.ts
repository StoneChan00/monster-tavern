import { describe, expect, it } from 'vitest';
import {
  materialSourceText,
  materialSourcesOf,
  upgradeUsageText,
  isEliteDrop,
} from '../src/data/materialInfo';
import { SIGIL_OF } from '../src/data/balance';

/** 这些反查结果直接显示在背包与升级仪式里，属于玩家判断「去哪刷」的唯一依据 */

describe('材料来源反查', () => {
  it('精英魔核指向对应地图', () => {
    expect(materialSourceText('mat_elite_core_1')).toContain('图1');
    expect(materialSourceText('mat_elite_core_2')).toContain('图2');
    expect(materialSourceText('mat_elite_core_6')).toContain('图6');
  });

  it('图6 独有材料能反查到图6', () => {
    expect(materialSourceText('mat_void_essence')).toContain('图6');
    expect(materialSourceText('mat_void_essence')).not.toContain('图1');
  });

  it('每个职业徽记都有 ≥6 个精英来源，且全部来自精英', () => {
    for (const id of Object.values(SIGIL_OF)) {
      const sources = materialSourcesOf(id);
      expect(sources.length, id).toBeGreaterThanOrEqual(6);
      expect(sources.every((s) => s.elite), id).toBe(true);
      expect(isEliteDrop(id)).toBe(true);
    }
  });

  it('每个职业徽记在每张地图都能刷到（曲线不断裂）', () => {
    for (const id of Object.values(SIGIL_OF)) {
      const maps = new Set(materialSourcesOf(id).map((s) => s.map));
      expect([...maps].sort(), id).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });
});

describe('升级用途反查', () => {
  it('职业徽记覆盖 Lv4-10（含新开放的传奇档）', () => {
    expect(upgradeUsageText('mat_sigil_bard')).toContain('吟游诗人');
    expect(upgradeUsageText('mat_sigil_bard')).toContain('Lv.4-10');
  });

  it('图6 魔核用于 9、10 级', () => {
    const text = upgradeUsageText('mat_elite_core_6');
    expect(text).toContain('Lv.9-10');
  });

  it('普通材料（凝胶）用于 2 级，不属于精英掉落', () => {
    expect(upgradeUsageText('mat_gel')).toContain('Lv.2');
    expect(isEliteDrop('mat_gel')).toBe(false);
  });
});
