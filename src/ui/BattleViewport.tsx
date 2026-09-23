import { useEffect, useRef } from 'react';
import { Application, Assets, Container, Graphics, Sprite, Text, Texture, TilingSprite } from 'pixi.js';
import { useGameStore } from '../store/gameStore';
import { CLASSES } from '../data/classes';
import { MONSTERS } from '../data/monsters';
import { MAPS, MAP_DEFS } from '../data/monsters';
import { CLASS_SPRITES, MONSTER_SPRITES } from '../data/sprites';
import { getPartyMembers } from '../engine/party';
import type { ClassId, EventRecord, GameState, MonsterId } from '../engine/types';

/** 6 张主题地图的地板贴图清单（与 MAP_DEFS 顺序一致） */
const MAP_DEFS_FLOOR_SPRITES = MAP_DEFS.map((m) => m.floorSprite);

const VIEW_H = 190;
const SPRITE_SCALE = 3;
const PARTY_X = 64;
const MONSTER_X_OFFSET = 74;
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
    /** 6 张主题地图的地板纹理（按 MAP_DEFS 顺序） */
    const floorTextures: Array<Texture | null> = [];
    const textureCache = new Map<MonsterId, Texture>();
    const classTextureCache = new Map<ClassId, Texture>();
    let floorLayer: TilingSprite | null = null;
    let dimLayer: Graphics | null = null;
    /** 当前背景地图签名（切图时换纹理 + tint） */
    let mapSignature = '';
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

    const layoutParty = (state: GameState): void => {
      const members = getPartyMembers(state);
      const sig = members.map((m) => m.adv.id).join(',');
      if (sig === partySignature) {
        for (const m of members) {
          const u = partyUnits.get(m.adv.id);
          if (u && m.adv.hp <= 0 && u.root.alpha > 0.5) u.root.alpha = 0.35;
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
        root.position.set(PARTY_X, y);
        root.alpha = m.adv.hp <= 0 ? 0.35 : 1;
        app.stage.addChild(root);
        partyUnits.set(m.adv.id, { root, baseX: PARTY_X, baseY: y });
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
            if (a) addTween(340, (k) => void (a.root.x = a.baseX + Math.sin(k * Math.PI) * 24));
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
            if (a) addTween(340, (k) => void (a.root.x = a.baseX - Math.sin(k * Math.PI) * 24));
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
          showBanner(e.isBoss ? '👑 BOSS 战！' : `第 ${e.wave} 波`, e.isBoss ? '#ff8a80' : '#f0d78c');
          break;
        case 'waveClear':
          showBanner(e.isBoss ? '👑 层底 BOSS 肃清！' : `第 ${e.wave} 波肃清 ✅`, '#9ccc65');
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
      if (floorLayer) floorLayer.width = w;
      if (dimLayer) {
        dimLayer.clear().rect(0, 0, w, VIEW_H).fill({ color: 0x141009, alpha: 0.4 });
      }
      relayout();
    });

    void (async () => {
      // 预载像素贴图（CC0 Kenney），失败则回退 emoji
      const monsterEntries = Object.entries(MONSTER_SPRITES);
      const classEntries = Object.entries(CLASS_SPRITES);
      try {
        const urls = [
          ...monsterEntries.map(([, file]) => `/sprites/monsters/${file}`),
          ...classEntries.map(([, file]) => `/sprites/classes/${file}`),
          ...MAP_DEFS_FLOOR_SPRITES.map((file) => `/sprites/tiles/${file}`),
        ];
        const textures = await Assets.load(urls);
        for (const [id, file] of monsterEntries) {
          const tex = textures[`/sprites/monsters/${file}`];
          if (tex) {
            tex.source.scaleMode = 'nearest';
            textureCache.set(id, tex);
          }
        }
        for (const [id, file] of classEntries) {
          const tex = textures[`/sprites/classes/${file}`];
          if (tex) {
            tex.source.scaleMode = 'nearest';
            classTextureCache.set(id, tex);
          }
        }
        for (const file of MAP_DEFS_FLOOR_SPRITES) {
          const tex = textures[`/sprites/tiles/${file}`];
          if (tex) tex.source.scaleMode = 'nearest';
          floorTextures.push(tex ?? null);
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

      // 地牢背景：按当前地图主题平铺地板 + tint + 压暗层（保可读性）
      const applyMapTheme = (state: GameState): void => {
        const sig = `${state.dungeon.activeMap}`;
        if (sig === mapSignature) return;
        mapSignature = sig;
        const mapDef = MAPS[state.dungeon.mapId] ?? MAPS[`map_${state.dungeon.activeMap}`];
        const tex = floorTextures[(mapDef?.number ?? 1) - 1] ?? null;
        if (!tex) {
          if (floorLayer) {
            floorLayer.destroy();
            floorLayer = null;
          }
          return;
        }
        const w = Math.max(240, host.clientWidth);
        if (floorLayer) {
          floorLayer.texture = tex;
          floorLayer.width = w;
          floorLayer.tint = mapDef.floorTint;
        } else {
          floorLayer = new TilingSprite({ texture: tex, width: w, height: VIEW_H });
          floorLayer.tileScale.set(2);
          floorLayer.tint = mapDef.floorTint;
          app.stage.addChildAt(floorLayer, 0);
        }
      };
      const initW = Math.max(240, host.clientWidth);
      dimLayer = new Graphics().rect(0, 0, initW, VIEW_H).fill({ color: 0x141009, alpha: 0.4 });
      app.stage.addChild(dimLayer);

      // 初始同步：跳过历史积压，从当前战斗状态直接开始
      const state0 = useGameStore.getState().state;
      applyMapTheme(state0);
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

        // 编队/存活同步（每帧，签名变更才重建）+ 地图主题同步
        layoutParty(state);
        applyMapTheme(state);
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
