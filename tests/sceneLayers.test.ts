import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';

/**
 * 回归守护：BattleViewport 图层挂载序列（2026-09-30 白屏事故教训）。
 * Pixi v8 的 addChildAt 对 index > children.length 直接 throw（不钳制），
 * 图层初始化必须用顺序 addChild；地板层由 buildScene 以 addChildAt(layer, 1) 动态插入。
 */
describe('战斗视口图层序列', () => {
  it('初始化 + 地板插入 + 重建全程不抛错，z 序 = 背景/地板/装饰/压暗/单位/前景', () => {
    const stage = new Container();
    const backdropLayer = new Container();
    const propsLayer = new Container();
    const dimLayer = new Container();
    const unitLayer = new Container();
    const fgLayer = new Container();

    expect(() => {
      stage.addChild(backdropLayer);
      stage.addChild(propsLayer);
      stage.addChild(dimLayer);
      stage.addChild(unitLayer);
      stage.addChild(fgLayer);
    }).not.toThrow();

    const floor1 = new Container();
    expect(() => stage.addChildAt(floor1, 1)).not.toThrow();
    expect(stage.children[1]).toBe(floor1);

    floor1.destroy({ children: true });
    const floor2 = new Container();
    expect(() => stage.addChildAt(floor2, 1)).not.toThrow();

    expect(stage.children).toEqual([backdropLayer, floor2, propsLayer, dimLayer, unitLayer, fgLayer]);
  });

  it('越界 addChildAt 抛错（语义锚定：pixi 不做越界钳制，禁止依赖容错）', () => {
    const stage = new Container();
    stage.addChild(new Container());
    expect(() => stage.addChildAt(new Container(), 2)).toThrow();
  });
});
