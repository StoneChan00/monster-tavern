/**
 * 酒馆像素场景生成器：内景（区域热区导航图）+ 外景（建筑装饰图）。
 * 素材：assets/packs/kenney-roguelike-indoor（16x16, 17px 步进 sheet, 26 列网格）
 *      assets/packs/kenney-tiny-town/Tiles（独立 16x16 PNG）
 * 产出：public/sprites/tavern/tavern-interior.png (32x18 tile = 512x288)
 *      public/sprites/tavern/tavern-exterior.png (24x14 tile = 384x224)
 *
 * 布局用字符矩阵定义：每字符 = 1 tile，先铺地板/墙，家具按行序贴（南盖北）。
 * 用法：node assets/tools/gen-tavern-scene.cjs
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(ROOT, 'public', 'sprites', 'tavern');
const INDOOR_SHEET = PNG.sync.read(
  fs.readFileSync(path.join(ROOT, 'assets/packs/kenney-roguelike-indoor/Spritesheet/roguelikeIndoor_transparent.png')),
);
const TOWN_DIR = path.join(ROOT, 'assets/packs/kenney-tiny-town/Tiles');

const INDOOR_COLS = 26; // sheet 网格 26x18（col 26 被裁边弃用）
const TS = 16;

/** indoor tile 切图缓存。id = row*26+col */
const indoorCache = new Map();
function indoor(id) {
  if (indoorCache.has(id)) return indoorCache.get(id);
  const row = Math.floor(id / INDOOR_COLS), col = id % INDOOR_COLS;
  const t = new PNG({ width: TS, height: TS });
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      const si = (INDOOR_SHEET.width * (row * 17 + y) + (col * 17 + x)) * 4;
      const di = (TS * y + x) * 4;
      t.data[di] = INDOOR_SHEET.data[si]; t.data[di + 1] = INDOOR_SHEET.data[si + 1];
      t.data[di + 2] = INDOOR_SHEET.data[si + 2]; t.data[di + 3] = INDOOR_SHEET.data[si + 3];
    }
  indoorCache.set(id, t);
  return t;
}

/** tiny-town 独立 tile */
const townCache = new Map();
function town(n) {
  if (townCache.has(n)) return townCache.get(n);
  const t = PNG.sync.read(fs.readFileSync(path.join(TOWN_DIR, `tile_${String(n).padStart(4, '0')}.png`)));
  townCache.set(n, t);
  return t;
}

/** 确定性 PRNG（同 gen-floors.cjs） */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function put(png, x, y, c) {
  const i = (png.width * y + x) * 4;
  png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = 255;
}

/** 程序化暖色木板地板：长横板 + 稀疏竖缝 + 行间错位板缝（打破全图网格感） */
const FLOOR_PAL = { base: [196, 152, 110], seam: [172, 130, 90], light: [206, 164, 122] };
function floorTile(tx, ty) {
  const png = new PNG({ width: TS, height: TS });
  const seams = ty % 2 === 0 ? [4, 9, 14] : [2, 7, 12]; // 奇偶行错位
  const bands = ty % 2 === 0 ? [0, 5, 10] : [0, 3, 8, 13];
  const vseams = [];
  for (let b = 0; b < 3; b++) {
    const h = rng(ty * 100 + b + 7)();
    vseams[b] = h < 0.15 ? Math.floor(rng(ty * 977 + b * 31 + tx)() * 12) + 2 : -1;
  }
  for (let y = 0; y < TS; y++) {
    const seamY = seams.includes(y);
    const vs = vseams[0];
    for (let x = 0; x < TS; x++) {
      let c = FLOOR_PAL.base;
      if (seamY) c = FLOOR_PAL.seam;
      else if (x === vs && !seamY) c = FLOOR_PAL.seam;
      else if (bands.includes(y)) c = FLOOR_PAL.light; // 板顶微高光
      put(png, x, y, c);
    }
  }
  return png;
}

/** 程序化窗：深木框 + 暖黄玻璃十字格（挂墙面） */
function windowTile() {
  const png = new PNG({ width: TS, height: TS });
  const frame = [92, 62, 38], frameHi = [124, 88, 52], glass = [238, 196, 116], glassDark = [204, 156, 88];
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      let c;
      if (x < 2 || x > 13 || y < 2 || y > 13) c = frame;          // 外框
      else if (x === 2 || y === 2) c = frameHi;                    // 内框高光
      else if (x === 7 || x === 8 || y === 7 || y === 8) c = frame; // 十字棂
      else c = (x < 8) === (y < 8) ? glass : glassDark;            // 4 格玻璃（对角色调）
      put(png, x, y, c);
    }
  return png;
}

/** 程序化下行楼梯（2x1 tile 整体）：side='L'/'R' × half='top'/'bottom'。
 *  top：洞口深处黑 + 远端两级暗台阶；bottom：近端两级亮台阶（接地板）。纵深自上而下渐亮 */
function stairTile(side, half) {
  const png = new PNG({ width: TS, height: TS });
  const tFar = [122, 94, 64], rFar = [96, 72, 48], tMid = [166, 128, 84], rMid = [122, 90, 60];
  const tNear = [198, 156, 106], tNearHi = [224, 184, 130], void_ = [16, 11, 8], edge = [110, 80, 52];
  const bands = half === 'top'
    ? [
        { y: 8, h: 1, c: rFar }, { y: 9, h: 2, c: tFar },   // 远端第一级（暗）
        { y: 11, h: 1, c: rFar }, { y: 12, h: 2, c: tFar },
        { y: 14, h: 1, c: rFar }, { y: 15, h: 1, c: tFar },
      ]
    : [
        { y: 0, h: 1, c: rMid }, { y: 1, h: 3, c: tMid },   // 中级
        { y: 4, h: 1, c: rMid }, { y: 5, h: 3, c: tMid },
        { y: 8, h: 1, c: tNear }, { y: 9, h: 3, c: tNearHi }, // 最下级（最亮）
        { y: 12, h: 1, c: tNear }, { y: 13, h: 3, c: tNear },
      ];
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      let c = half === 'top' ? void_ : tMid; // top 默认洞黑；bottom 默认台阶
      for (const b of bands) {
        if (y >= b.y && y < b.y + b.h) { c = b.c; break; }
      }
      // 两侧洞壁（top 行斜收，bottom 直壁）
      const wallW = half === 'top' ? Math.max(1, 4 - Math.floor(y / 4)) : y < 8 ? 2 : 1;
      if ((side === 'L' && x < wallW) || (side === 'R' && x >= TS - wallW)) c = edge;
      put(png, x, y, c);
    }
  // 台阶横缝强调
  const seams = half === 'top' ? [11, 14] : [4, 8, 12];
  for (const sy of seams) for (let x = 0; x < TS; x++) put(png, x, sy, [66, 48, 32]);
  return png;
}

/** 程序化壁挂火炬：木托 + 大火焰（黄芯/橙焰），比素材 tile 更醒目 */
function torchTile() {
  const png = new PNG({ width: TS, height: TS }); // 全透明底
  const wood = [120, 78, 44], flame = [232, 128, 52], core = [255, 224, 120], edge = [176, 62, 38];
  // 火焰图案（10 行，'C'=芯 'X'=焰 'E'=红边 '.'=空）
  const F = [
    '.......E....',
    '......EE....',
    '......XE....',
    '.....XXX....',
    '....XXXXX...',
    '...ECCXXXE..',
    '...ECCCXXE..',
    '...XXCCXXX..',
    '...XXXXXXXX.',
    '..EEXXXXXXE.',
  ];
  for (let r = 0; r < F.length; r++)
    for (let c = 0; c < F[r].length; c++) {
      const ch = F[r][c];
      if (ch === '.') continue;
      const col = ch === 'C' ? core : ch === 'E' ? edge : flame;
      put(png, 3 + c, r, col);
    }
  // 挂杆 + 托盘
  for (let y = 11; y <= 14; y++) { put(png, 7, y, wood); put(png, 8, y, wood); }
  for (let x = 4; x <= 11; x++) put(png, x, 11, wood);
  put(png, 4, 12, wood); put(png, 11, 12, wood);
  return png;
}

/** 程序化书架（图鉴）：木框 3 层格 + 彩色书脊 */
function bookshelfTile() {
  const png = new PNG({ width: TS, height: TS });
  const frame = [104, 70, 40], frameHi = [136, 96, 56], shelf = [88, 58, 32], back = [58, 40, 24];
  const books = [[188, 60, 52], [66, 110, 168], [92, 148, 76], [214, 168, 70], [150, 92, 160]];
  const rand = rng(2026);
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      let c = back;
      if (x < 2 || x > 13 || y < 2 || y > 13) c = frame;      // 外框
      else if (x === 2 || y === 2) c = frameHi;                // 内框高光
      else if (y === 6 || y === 7 || y === 11 || y === 12) c = shelf; // 层板（3 层：2-5 / 8-10 / 13 内）
      put(png, x, y, c);
    }
  // 书脊：每层随机 5-6 本
  const rows = [[3, 5], [8, 10], [13, 13]];
  for (const [y0, y1] of rows) {
    let x = 3;
    while (x <= 12) {
      const w = 1 + Math.floor(rand() * 2);
      const col = books[Math.floor(rand() * books.length)];
      for (let y = y0; y <= Math.min(y1, 13); y++)
        for (let dx = 0; dx < w && x + dx <= 12; dx++) put(png, x + dx, y, col);
      x += w + (rand() < 0.3 ? 1 : 0);
    }
  }
  return png;
}

/** 程序化红毯 tile：暗红底 + 织纹（多 tile 拼接无边界问题） */
function carpetTile(v) {
  const png = new PNG({ width: TS, height: TS });
  const base = [128, 52, 46], dark = [110, 42, 38], gold = [186, 132, 66];
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      let c = base;
      if ((x + y * 2 + v * 3) % 9 === 0) c = dark;   // 织纹
      else if ((x - y + v) % 11 === 0) c = gold;     // 金丝点缀
      put(png, x, y, c);
    }
  return png;
}

/** 克隆 tile PNG */
function cloneTile(t) {
  const png = new PNG({ width: t.width, height: t.height });
  png.data.set(t.data);
  return png;
}

/** 床头叠白枕头：增强「这是一张床」的可读性（放在三联床左端 tile） */
function bedWithPillow(id) {
  const t = cloneTile(indoor(id));
  const pillow = [238, 232, 214], pillowShade = [204, 196, 178];
  for (let y = 2; y <= 7; y++)
    for (let x = 3; x <= 8; x++) {
      // 圆角：跳过四角
      if ((x === 3 || x === 8) && (y === 2 || y === 7)) continue;
      put(t, x, y, y === 7 ? pillowShade : pillow);
    }
  return t;
}

/** 程序化炉灶三联（side: 'L'/'M'/'R'）：红砖框 + 大黑炉口 + 满口炉火（壁炉式，辨识度优先） */
function stoveTile(side) {
  const png = new PNG({ width: TS, height: TS });
  const body = [158, 74, 52], bodyDark = [122, 54, 38], top = [96, 92, 98];
  const mouth = [24, 16, 12], fire = [248, 150, 56], fireCore = [255, 224, 120], arch = [76, 72, 78];
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      let c = body;
      if (y === 1) c = top;                        // 石台面
      else if (y === 2 || y === 3) c = arch;       // 炉口拱楣
      else if (y >= 4 && y <= 13) {
        const inMouth = side === 'M' ? x >= 2 && x <= 13
          : side === 'L' ? x >= 7 : x <= 8;
        c = inMouth ? mouth : body;
      }
      else if (y === 14) c = bodyDark;
      put(png, x, y, c);
    }
  // 端面封板
  if (side === 'L') for (let y = 2; y < 15; y++) { put(png, 0, y, bodyDark); put(png, 1, y, body); }
  if (side === 'R') for (let y = 2; y < 15; y++) { put(png, 15, y, bodyDark); put(png, 14, y, body); }
  // 满口炉火：火焰图案占炉口大部（底宽上尖）
  const F = [
    '....f......',
    '...fff.....',
    '...fff..f..',
    '..fffff.f..',
    '..fCfffff..',
    '.ffCCfffFf.',
    '.fCCCfffff.',
    'ffCCfffFff.',
  ];
  const ox = side === 'L' ? 8 : side === 'R' ? 2 : 3;
  for (let r = 0; r < F.length; r++)
    for (let c = 0; c < F[r].length; c++) {
      const ch = F[r][c];
      if (ch === '.') continue;
      const x = ox + c, y = 6 + r;
      if (x < 0 || x > 15 || y > 13) continue;
      const inMouth = side === 'M' ? x >= 2 && x <= 13 : side === 'L' ? x >= 7 : x <= 8;
      if (!inMouth) continue;
      put(png, x, y, ch === 'C' ? fireCore : ch === 'F' ? fireCore : fire);
    }
  return png;
}

/** 程序化木门（side: 'L' 左半 / 'R' 右半）：深棕门板 + 拱形 + 亮把手 */
function doorTile(side) {
  const png = new PNG({ width: TS, height: TS });
  const frame = [86, 58, 34], plank = [136, 92, 54], plankHi = [162, 116, 72], knob = [235, 200, 110];
  const dark = [46, 30, 20];
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      let c = plank;
      if (y < 2) c = frame;                        // 门楣
      else if (side === 'L' && x < 2) c = frame;   // 左门框
      else if (side === 'R' && x > 13) c = frame;  // 右门框
      else if (y === 2) c = plankHi;               // 顶高光
      else if ((side === 'L' ? x : 15 - x) === 5 && y > 3) c = dark;   // 拱形内凹线
      else if ((side === 'L' ? x : 15 - x) === 9 && y > 2) c = dark;   // 门板拼缝
      else if (y > 13) c = frame;                  // 底槛
      put(png, x, y, c);
    }
  // 把手：右半门中央
  if (side === 'R') { put(png, 3, 8, knob); put(png, 3, 9, knob); }
  // 拱顶斜角（左上/右上）
  if (side === 'L') { put(png, 3, 2, frame); put(png, 3, 3, frame); }
  else { put(png, 12, 2, frame); put(png, 12, 3, frame); }
  return png;
}

/** 程序化立式酒桶：鼓形桶身（中宽）+ 双道铁箍 + 顶部椭圆面 */
function barrelTile() {
  const png = new PNG({ width: TS, height: TS }); // 透明底
  const wood = [172, 118, 70], woodHi = [204, 156, 104], woodDark = [136, 88, 50];
  const hoop = [116, 116, 126], hoopHi = [172, 172, 184], top = [150, 102, 62];
  for (let y = 3; y <= 15; y++) {
    // 鼓形：中部外扩（x1-14），顶底收窄（x3-12）
    const bulge = y >= 6 && y <= 12;
    const x0 = bulge ? 1 : y === 3 || y === 4 ? 3 : 2;
    const x1 = bulge ? 14 : y === 3 || y === 4 ? 12 : 13;
    for (let x = x0; x <= x1; x++) {
      let c = (x - x0) % 3 === 2 ? woodDark : wood; // 桶板条竖纹
      if (x === x0 + 1 || x === x1 - 1) c = wood;   // 边板
      put(png, x, y, c);
    }
  }
  // 顶部椭圆面
  for (let x = 4; x <= 11; x++) { put(png, x, 2, top); put(png, x, 3, top); }
  for (let x = 5; x <= 10; x++) put(png, x, 1, top);
  put(png, 6, 1, woodHi); put(png, 7, 2, woodHi); // 顶面高光
  // 铁箍两道（鼓形最宽处）
  for (const hy of [6, 11]) {
    for (let x = 1; x <= 14; x++) put(png, x, hy, hoop);
    put(png, 2, hy, hoopHi); put(png, 3, hy, hoopHi);
  }
  return png;
}

/** 程序化暗色地板 tile（地牢入口洞口） */
function darkTile(v) {
  const png = new PNG({ width: TS, height: TS });
  const base = [30, 22, 16], light = [44, 32, 22];
  for (let y = 0; y < TS; y++)
    for (let x = 0; x < TS; x++) {
      const i = (TS * y + x) * 4;
      const c = (x + y * 3 + v * 5) % 7 === 0 ? light : base;
      png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = 255;
    }
  return png;
}

/** alpha 合成：src 覆盖到 dst (x,y)，跳过透明像素 */
function blit(dst, src, x, y) {
  for (let sy = 0; sy < src.height; sy++) {
    const dy = y + sy;
    if (dy < 0 || dy >= dst.height) continue;
    for (let sx = 0; sx < src.width; sx++) {
      const dx = x + sx;
      if (dx < 0 || dx >= dst.width) continue;
      const si = (src.width * sy + sx) * 4;
      if (src.data[si + 3] < 128) continue;
      const di = (dst.width * dy + dx) * 4;
      dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = 255;
    }
  }
}

// ══════════════ 内景布局（32 列 x 18 行）══════════════
// 分区：左翼宿舍(床x3) / 中上吧台前台 / 中下招待区(圆桌+红毯) / 右翼厨房 / 底部地牢入口(楼梯) / 左上书架(图鉴)
const INTERIOR = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW', // r0 墙顶
  'VVwVVVpVVfVVVVwVVVpVVfVVVwVVpVfV', // r1 墙面：窗x3 画x3 火炬x3
  '..KKK.......hHhH......4556......', // r2 书架(图鉴) 吧台后柜 灶台
  '..(=)......cnnnnva..............', // r3 红床 吧台+酒桶
  '.................g....1223......', // r4 盆栽 料理桌
  '..{-}..............hH...........', // r5 绿床1 厨房高柜
  '..........................1223..', // r6 料理桌2
  '..[~]...........................', // r7 绿床2
  '.........s......s...............', // r8 桌A/B 上凳
  '....g...sts....sts..............', // r9 盆栽 圆桌A/B+凳
  '.........s......s.........aa....', // r10 桌A/B 下凳 + 右下酒桶
  '.............CCCCCC...........aa', // r11 红毯 + 酒桶堆（下层）
  '............sCCCCCCs............', // r12 桌C 上凳（毯上）
  '...........stsCCCCsts...........', // r13 圆桌C/D+凳（毯上）
  '...........ms.....ms............', // r14 下凳 + 地牢入口烛台
  '.............oUVo...............', // r15 楼梯上半（远端暗台阶 + 洞黑）
  '.............oWYo...............', // r16 楼梯下半（近端亮台阶）
  '................................', // r17
];

const INTERIOR_SYMBOLS = {
  W: () => indoor(24),  // 墙板
  V: () => indoor(23),  // 竖纹墙板
  w: () => windowTile(),// 程序化窗
  p: () => indoor(332), // 挂画
  f: () => torchTile(), // 程序化壁挂火炬
  K: () => bookshelfTile(), // 程序化书架
  '(': () => bedWithPillow(250), '=': () => indoor(251), ')': () => indoor(252), // 红床（左端带枕头）
  '{': () => bedWithPillow(276), '-': () => indoor(277), '}': () => indoor(278), // 绿床1
  '[': () => bedWithPillow(302), '~': () => indoor(303), ']': () => indoor(304), // 绿床2
  c: () => indoor(170), n: () => indoor(196), v: () => indoor(171),       // 吧台
  h: () => indoor(222), H: () => indoor(223), // 高柜
  t: () => indoor(30),  // 圆桌
  s: () => indoor(157), // 凳子
  '1': () => indoor(160), '2': () => indoor(161), '3': () => indoor(163), // 料理桌
  '4': () => stoveTile('L'), '5': () => stoveTile('M'), '6': () => stoveTile('R'), // 程序化灶台
  U: () => stairTile('L', 'top'), V: () => stairTile('R', 'top'),       // 楼梯上半（远端暗台阶+洞黑）
  W: () => stairTile('L', 'bottom'), Y: () => stairTile('R', 'bottom'), // 楼梯下半（近端亮台阶）
  d: () => doorTile('L'), e: () => doorTile('R'),   // 程序化木门
  a: () => barrelTile(), // 程序化立式酒桶
  g: () => indoor(255), // 盆栽
  m: () => indoor(173), // 蜡烛
  x: () => indoor(164), // 床头柜
  C: (v) => carpetTile(v), // 程序化红毯
  o: (v) => darkTile(v), // 暗色洞口
};

function buildInterior() {
  const W = 32, H = 18;
  const img = new PNG({ width: W * TS, height: H * TS });
  const rand = rng(20261019);
  for (let r = 0; r < H; r++) {
    const line = INTERIOR[r];
    if (line.length !== W) throw new Error(`interior row ${r} width ${line.length} != ${W}`);
    for (let c = 0; c < W; c++) {
      const ch = line[c];
      const px = c * TS, py = r * TS;
      if (ch === '.') {
        blit(img, floorTile(c, r), px, py); // 程序化长板木地板（全局坐标感知）
      } else {
        const make = INTERIOR_SYMBOLS[ch];
        if (!make) throw new Error(`interior unknown symbol '${ch}' @ (${c},${r})`);
        blit(img, make(c + r * 31), px, py);
      }
    }
  }
  return img;
}

// ══════════════ 外景布局（24 列 x 14 行）══════════════
// 建筑：红瓦屋顶 + 木墙(t072/073/075) + 门(t085) + 招牌(t083) + 窗(t087)；土路对齐门(列 11-12) 直通门口
const EXTERIOR = [
  '........................',
  '..T................T....',
  '.........RrrrrF.........',
  '........RrrrrrrF........',
  '........RrrrrrrF........',
  '........AlWllWlZ........',
  '........AllllllZ........',
  '........AllDSllZ........',
  '...........PP....T......',
  '...........PP...........',
  '....M......PP.........XT',
  '...........PP...........',
  '...........PP...........',
  'NNN.......PP........NNNN',
];

const EXTERIOR_SYMBOLS = {
  R: () => town(52), r: () => town(53), F: () => town(54), // 红瓦屋顶
  A: () => town(72), l: () => town(73), Z: () => town(75), // 木墙（棕）
  D: () => town(85), // 门
  S: () => town(83), // 挂牌招牌
  W: () => town(87), // 窗
  P: () => town(37), // 土路
  T: () => town(5),  // 圆树
  N: () => town(44), // 栅栏
  M: () => town(17), // 蘑菇
  X: () => town(112), // 石块
};

const GRASS_VARIANTS = [0, 0, 0, 12]; // 以纯草为主，少量变体

function buildExterior() {
  const W = 24, H = 14;
  const img = new PNG({ width: W * TS, height: H * TS });
  const rand = rng(42);
  for (let r = 0; r < H; r++) {
    const line = EXTERIOR[r];
    if (line.length !== W) throw new Error(`exterior row ${r} width ${line.length} != ${W}`);
    for (let c = 0; c < W; c++) {
      const ch = line[c];
      const px = c * TS, py = r * TS;
      if (ch === '.') {
        const v = GRASS_VARIANTS[Math.floor(rand() * GRASS_VARIANTS.length)];
        blit(img, town(v), px, py);
      } else {
        const make = EXTERIOR_SYMBOLS[ch];
        if (!make) throw new Error(`exterior unknown symbol '${ch}' @ (${c},${r})`);
        blit(img, make(), px, py);
      }
    }
  }
  return img;
}

// ══════════════ 导出 ══════════════
fs.mkdirSync(OUT_DIR, { recursive: true });
const interior = buildInterior();
const exterior = buildExterior();
fs.writeFileSync(path.join(OUT_DIR, 'tavern-interior.png'), PNG.sync.write(interior));
fs.writeFileSync(path.join(OUT_DIR, 'tavern-exterior.png'), PNG.sync.write(exterior));
console.log(`interior -> ${interior.width}x${interior.height} (32x18 tiles)`);
console.log(`exterior -> ${exterior.width}x${exterior.height} (24x14 tiles)`);
console.log(`output dir: ${path.relative(ROOT, OUT_DIR)}`);
