import { useEffect, useRef } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, Texture } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { BALANCE } from '../data/balance';
import { CLASSES } from '../data/classes';
import { MONSTERS } from '../data/monsters';
import { MAPS, MAP_DEFS } from '../data/monsters';
import { CLASS_SPRITES, MONSTER_SPRITES } from '../data/sprites';
import { getPartyMembers } from '../engine/party';
import type { ClassId, EventRecord, GameState, MonsterId } from '../engine/types';

/** 全部地板贴图（去重后预载；每图 2 基底 + 1 点缀） */
const FLOOR_SPRITE_FILES = [...new Set(MAP_DEFS.flatMap((m) => m.floorSprites))];

const VIEW_H = 190;
const SPRITE_SCALE = 3;
const PARTY_X = 64;
const MONSTER_X_OFFSET = 74;
/** 地板格：16px 贴图 × 2 倍缩放 */
const FLOOR_CELL = 32;
const MAX_QUEUE = 12; // 超过则丢弃旧事件（离线积压场景）
const KEEP_ON_OVERFLOW = 4;
const CLAMP_DT_MS = 100;

interface Unit {
  root: Container;
  baseX: number;
  baseY: number;
}

interface Tween {
  t: number; // 负数 = 延迟
  dur: number;
  tick: (k: number) => void;
  end?: () => void;
}

const easeOut = (k: number): number => 1 - (1 - k) * (1 - k);

/**
 * 战斗视口：订阅引擎事件流（state.events）做动画回放。
 * 贴图对撞 + 攻击前倾 + 伤害飘字 + 波次/结算横幅 + 灭队演出。
 * 纯展示组件：不参与任何规则计算，水位线消费 + 积压丢弃。
 */
export function BattleViewport() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let destroyed = false;
    const app = new Application();
    /** 地板纹理（按文件名索引） */
    const floorTextures = new Map<string, Texture>();
    const textureCache = new Map<MonsterId, Texture>();
    const classTextureCache = new Map<ClassId, Texture>();
    /** 变体混铺地板层（Container of Sprite，位置哈希选变体） */
    let floorLayer: Container | null = null;
    let dimLayer: Graphics | null = null;
    /** 当前地板签名（切图/缩放时重建） */
    let floorSignature = '';
    const partyUnits = new Map<string, Unit>();
    const monsterUnits = new Map<number, Unit>();
    const queue: EventRecord[] = [];
    const tweens: Tween[] = [];
    let partySignature = '';
    let lastEventId = 0;
    let banner: Text | null = null;

    const stageWidth = (): number => app.renderer.width / app.renderer.resolution;

    const addTween = (dur: number, tick: (k: number) => void, end?: () => void, delay = 0): void => {
      tweens.push({ t: -delay, dur, tick, end });
    };

    const destroyUnit = (u: Unit): void => {
      if (!u.root.destroyed) u.root.destroy({ children: true });
    };

    const makeIcon = (monsterId?: MonsterId, classId?: string): Sprite | Text => {
      if (monsterId) {
        const tex = textureCache.get(monsterId);
        if (tex) {
          const sp = new Sprite(tex);
          sp.anchor.set(0.5);
          // 魔物在右侧，镜像朝向左（面向队伍）
          sp.scale.set(-SPRITE_SCALE, SPRITE_SCALE);
          return sp;
        }
        return new Text({
          text: MONSTERS[monsterId]?.icon ?? '❔',
          style: { fontFamily: 'sans-serif', fontSize: 30 },
        });
      }
      const classTex = classId ? classTextureCache.get(classId) : undefined;
      if (classTex) {
        const sp = new Sprite(classTex);
        sp.anchor.set(0.5);
        sp.scale.set(SPRITE_SCALE);
        return sp;
      }
      return new Text({
        text: CLASSES[classId ?? 'warrior']?.icon ?? '🧑',
        style: { fontFamily: 'sans-serif', fontSize: 30 },
      });
    };

    const spreadY = (i: number, n: number): number => {
      const count = Math.max(1, n);
      if (count === 1) return VIEW_H / 2;
      return 34 + (i * (VIEW_H - 68)) / (count - 1);
    };

    /** 站位纵深：前排更贴近魔物、后排靠后（X 轴错位体现前后排） */
    const rowXOffset = (slot: number): number => {
      const row = BALANCE.SLOT_ROWS[slot];
      if (row === 'front') return 22;
      if (row === 'mid') return 0;
      return -22;
    };

    const layoutParty = (state: GameState): void => {
      const members = getPartyMembers(state);
      const sig = members.map((m) => m.adv.id).join(',');
      if (sig === partySignature) {
        // 存活状态同步：倒下 → 半透明，复活/回复 → 恢复不透明
        for (const m of members) {
          const u = partyUnits.get(m.adv.id);
          if (!u || u.root.destroyed) continue;
          if (m.adv.hp <= 0) {
            if (u.root.alpha > 0.5) u.root.alpha = 0.35;
          } else if (u.root.alpha < 0.5) {
            u.root.alpha = 1;
          }
        }
        return;
      }
      partySignature = sig;
      for (const u of partyUnits.values()) destroyUnit(u);
      partyUnits.clear();
      members.forEach((m, i) => {
        const root = new Container();
        root.addChild(makeIcon(undefined, m.adv.classId));
        const y = spreadY(i, members.length);
        const x = PARTY_X + rowXOffset(m.slot);
        root.position.set(x, y);
        root.alpha = m.adv.hp <= 0 ? 0.35 : 1;
        app.stage.addChild(root);
        partyUnits.set(m.adv.id, { root, baseX: x, baseY: y });
      });
    };

    const buildMonsters = (
      list: Array<{ uid: number; monsterId: MonsterId }>,
      animate: boolean,
    ): void => {
      for (const u of monsterUnits.values()) destroyUnit(u);
      monsterUnits.clear();
      const mx = stageWidth() - MONSTER_X_OFFSET;
      list.forEach((m, i) => {
        const root = new Container();
        root.addChild(makeIcon(m.monsterId));
        const y = spreadY(i, list.length);
        root.position.set(mx, y);
        app.stage.addChild(root);
        monsterUnits.set(m.uid, { root, baseX: mx, baseY: y });
        if (animate) {
          root.x = mx + 46;
          root.alpha = 0;
          addTween(
            280,
            (k) => {
              const e = easeOut(k);
              root.x = mx + 46 * (1 - e);
              root.alpha = e;
            },
            undefined,
            i * 70,
          );
        }
      });
    };

    const relayout = (): void => {
      const mx = stageWidth() - MONSTER_X_OFFSET;
      for (const u of monsterUnits.values()) {
        u.baseX = mx;
        u.root.x = mx;
      }
    };

    const showBanner = (text: string, color = '#f0e6d2'): void => {
      if (banner) {
        banner.destroy();
        banner = null;
      }
      const t = new Text({
        text,
        style: { fontFamily: 'sans-serif', fontSize: 15, fontWeight: 'bold', fill: color },
      });
      t.anchor.set(0.5);
      t.position.set(stageWidth() / 2, VIEW_H / 2);
      app.stage.addChild(t);
      banner = t;
      addTween(1000, (k) => {
        // 旧 banner 可能在补间期间被新 banner 替换销毁（如复活+新波次同帧）——守卫防 ticker 崩溃
        if (t.destroyed) return;
        t.alpha = k < 0.15 ? k / 0.15 : 1 - Math.max(0, (k - 0.65) / 0.35);
        t.scale.set(1 + 0.15 * Math.sin(Math.min(1, k * 2) * Math.PI));
      });
    };

    const floatText = (x: number, y: number, text: string, color: string, big = false): void => {
      const t = new Text({
        text,
        style: {
          fontFamily: 'sans-serif',
          fontSize: big ? 18 : 13,
          fontWeight: 'bold',
          fill: color,
          stroke: { color: '#000000', width: 3 },
        },
      });
      t.anchor.set(0.5);
      t.position.set(x, y - 16);
      app.stage.addChild(t);
      addTween(
        650,
        (k) => {
          t.y = y - 16 - 26 * k;
          t.alpha = 1 - k;
        },
        () => t.destroy(),
      );
    };

    const playEvent = (e: EventRecord): void => {
      switch (e.kind) {
        case 'hit': {
          if (e.attackerSide === 'party') {
            const a = partyUnits.get(e.attackerId);
            const t = monsterUnits.get(e.targetUid);
            if (a) addTween(340, (k) => {
              if (a.root.destroyed) return;
              a.root.x = a.baseX + Math.sin(k * Math.PI) * 24;
            });
            if (t) {
              floatText(
                t.baseX,
                t.baseY,
                `-${e.damage}${e.crit ? '!' : ''}`,
                e.crit ? '#ffd24a' : '#ff8a80',
                e.crit,
              );
            }
          } else {
            const a = monsterUnits.get(e.attackerUid);
            const t = partyUnits.get(e.targetId);
            if (a) addTween(340, (k) => {
              if (a.root.destroyed) return;
              a.root.x = a.baseX - Math.sin(k * Math.PI) * 24;
            });
            if (t) floatText(t.baseX, t.baseY, `-${e.damage}`, '#ff8a80');
          }
          break;
        }
        case 'heal': {
          const t = partyUnits.get(e.targetId);
          if (t) floatText(t.baseX, t.baseY, `+${e.amount}`, '#9ccc65');
          break;
        }
        case 'death': {
          if (e.side === 'monster') {
            const u = monsterUnits.get(e.targetUid);
            monsterUnits.delete(e.targetUid);
            if (u) {
              addTween(
                380,
                (k) => {
                  u.root.alpha = 1 - k;
                  u.root.y = u.baseY + 8 * k;
                },
                () => destroyUnit(u),
              );
            }
          } else {
            const u = partyUnits.get(e.targetId);
            if (u) addTween(300, (k) => void (u.root.alpha = 1 - 0.65 * k));
          }
          break;
        }
        case 'waveStart':
          buildMonsters(e.monsters, true);
          showBanner(e.isElite ? '👑 精英来袭！' : `第 ${e.wave} 波`, e.isElite ? '#ff8a80' : '#f0d78c');
          break;
        case 'waveClear':
          showBanner(e.isElite ? '👑 精英讨伐成功！' : `第 ${e.wave} 波肃清 ✅`, '#9ccc65');
          break;
        case 'wipe':
          showBanner('💔 队伍全灭……', '#ff8a80');
          break;
        case 'revive':
          showBanner('🛏️ 休整完毕，满血重返！', '#9ccc65');
          break;
        case 'levelup': {
          const u = partyUnits.get(e.targetId);
          if (u) floatText(u.baseX, u.baseY - 8, `Lv.${e.level}!`, '#ffd24a', true);
          break;
        }
      }
    };

    const ro = new ResizeObserver(() => {
      if (destroyed) return;
      const w = Math.max(240, host.clientWidth);
      app.renderer.resize(w, VIEW_H);
      if (dimLayer) {
        dimLayer.clear().rect(0, 0, w, VIEW_H).fill({ color: 0x141009, alpha: 0.4 });
      }
      relayout();
    });

    void (async () => {
      // 预载像素贴图（CC0 Kenney），失败则回退 emoji。
      // URL 一律以 BASE_URL 前缀（GitHub Pages 子路径部署）
      const spriteUrl = (kind: 'monsters' | 'classes' | 'tiles', file: string) =>
        `${import.meta.env.BASE_URL}sprites/${kind}/${file}`;
      const monsterEntries = Object.entries(MONSTER_SPRITES);
      const classEntries = Object.entries(CLASS_SPRITES);
      try {
        const urls = [
          ...monsterEntries.map(([, file]) => spriteUrl('monsters', file)),
          ...classEntries.map(([, file]) => spriteUrl('classes', file)),
          ...FLOOR_SPRITE_FILES.map((file) => spriteUrl('tiles', file)),
        ];
        const textures = await Assets.load(urls);
        for (const [id, file] of monsterEntries) {
          const tex = textures[spriteUrl('monsters', file)];
          if (tex) {
            tex.source.scaleMode = 'nearest';
            textureCache.set(id as MonsterId, tex);
          }
        }
        for (const [id, file] of classEntries) {
          const tex = textures[spriteUrl('classes', file)];
          if (tex) {
            tex.source.scaleMode = 'nearest';
            classTextureCache.set(id as ClassId, tex);
          }
        }
        for (const file of FLOOR_SPRITE_FILES) {
          const tex = textures[spriteUrl('tiles', file)];
          if (tex) {
            tex.source.scaleMode = 'nearest';
            floorTextures.set(file, tex);
          }
        }
      } catch {
        /* emoji /纯色 回退 */
      }

      await app.init({
        background: '#141009',
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        width: Math.max(240, host.clientWidth),
        height: VIEW_H,
      });
      if (destroyed) {
        try {
          app.destroy(true, { children: true });
        } catch {
          /* 尚未完成初始化 */
        }
        return;
      }
      host.appendChild(app.canvas);
      ro.observe(host);

      // 地牢背景：按当前地图主题混铺地板变体 + tint + 压暗层（保可读性）。
      // 每格用位置哈希选变体（基底A 60% / 基底B 28% / 点缀 12%），稳定不闪烁。
      const buildFloor = (state: GameState): void => {
        const w = stageWidth();
        const sig = `${state.dungeon.activeMap}:${w}`;
        if (sig === floorSignature) return;
        floorSignature = sig;
        if (floorLayer) {
          floorLayer.destroy({ children: true });
          floorLayer = null;
        }
        const mapDef = MAPS[state.dungeon.mapId] ?? MAPS[`map_${state.dungeon.activeMap}`];
        const textures = (mapDef?.floorSprites ?? [])
          .map((f) => floorTextures.get(f))
          .filter((t): t is Texture => t !== undefined);
        if (textures.length === 0) return;
        const layer = new Container();
        const cols = Math.ceil(w / FLOOR_CELL) + 1;
        const rows = Math.ceil(VIEW_H / FLOOR_CELL);
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            const h =
              Math.abs((x * 73856093) ^ (y * 19349663) ^ (state.dungeon.activeMap * 83492791)) % 100;
            const tex =
              h < 60
                ? textures[0]
                : h < 88
                  ? textures[Math.min(1, textures.length - 1)]
                  : textures[textures.length - 1];
            const sp = new Sprite(tex);
            sp.position.set(x * FLOOR_CELL, y * FLOOR_CELL);
            sp.scale.set(2);
            sp.tint = mapDef.floorTint;
            layer.addChild(sp);
          }
        }
        floorLayer = layer;
        app.stage.addChildAt(layer, 0);
      };
      const initW = Math.max(240, host.clientWidth);
      dimLayer = new Graphics().rect(0, 0, initW, VIEW_H).fill({ color: 0x141009, alpha: 0.4 });
      app.stage.addChild(dimLayer);

      // 初始同步：跳过历史积压，从当前战斗状态直接开始
      const state0 = useGameStore.getState().state;
      buildFloor(state0);
      layoutParty(state0);
      buildMonsters(
        state0.dungeon.monsters.filter((m) => m.hp > 0).map((m) => ({ uid: m.uid, monsterId: m.monsterId })),
        false,
      );
      lastEventId = state0.events.length > 0 ? state0.events[state0.events.length - 1].id : 0;

      app.ticker.add((ticker) => {
        const dt = Math.min(ticker.deltaMS, CLAMP_DT_MS);

        // 补间推进
        for (let i = tweens.length - 1; i >= 0; i--) {
          const tw = tweens[i];
          tw.t += dt;
          if (tw.t < 0) continue;
          const k = Math.min(1, tw.t / tw.dur);
          tw.tick(k);
          if (k >= 1) {
            tweens.splice(i, 1);
            tw.end?.();
          }
        }

        // 事件消费（水位线 + 环缓冲裁剪感知）
        const state = useGameStore.getState().state;
        const events = state.events;
        if (events.length > 0 && events[0].id > lastEventId + 1) {
          lastEventId = events[0].id - 1; // 错过的积压直接跳过
        }
        for (const e of events) {
          if (e.id <= lastEventId) continue;
          lastEventId = e.id;
          queue.push(e);
        }
        if (queue.length > MAX_QUEUE) {
          queue.splice(0, queue.length - KEEP_ON_OVERFLOW);
        }
        while (queue.length > 0) {
          const e = queue.shift();
          if (e) playEvent(e);
        }

        // 编队/存活同步（每帧，签名变更才重建）+ 地板主题同步
        layoutParty(state);
        buildFloor(state);
      });
    })();

    return () => {
      destroyed = true;
      ro.disconnect();
      try {
        app.destroy(true, { children: true });
      } catch {
        /* 初始化未完成时忽略 */
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className="border-2 border-[#3a2d1e] bg-[#141009]"
      style={{ height: VIEW_H, width: '100%' }}
    />
  );
}
