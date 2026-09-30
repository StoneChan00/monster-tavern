/* 家具元素 + 房间场景合成器（32×32 = 2×2 家具网格 + 地板底）
 * 产物 → public/sprites/furniture/（房间场景）+ ui/（单件家具）
 * 风格：与 icon-grids.cjs 同调色板/同 2px 轮廓（docs/STYLE.md）
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..', '..');
const FURN = path.join(ROOT, 'public', 'sprites', 'furniture');
const UI = path.join(ROOT, 'public', 'sprites', 'ui');

const OUTLINE = [63, 38, 49];
const PAL = {
  o: OUTLINE,
  w: [255, 248, 236],
  F: [240, 230, 210],
  Y: [240, 215, 140], G: [217, 164, 65], g: [168, 120, 48],
  W: [176, 138, 94], M: [138, 98, 68], m: [107, 74, 50],
  R: [232, 96, 76], r: [192, 57, 43], e: [122, 45, 34],
  L: [165, 212, 122], l: [124, 179, 66], k: [74, 107, 47],
  H: [200, 200, 200], h: [138, 138, 138], x: [74, 74, 74],
  T: [200, 148, 104], t: [138, 90, 58],
  V: [179, 157, 219], v: [126, 87, 194],
};

/* ── 新家具元素（16×16）── */

const chair = [
  '................',
  '....oooo........',
  '....oWWo........',
  '....oWoWo.......',
  '....oWWoo.......',
  '....oWoWo.......',
  '..oooooooooo....',
  '.oWwwWWWWWWo....',
  '.oWWWWWWWWWo....',
  '..oooooooooo....',
  '...oMo..oMo.....',
  '...oMo..oMo.....',
  '...oMo..oMo.....',
  '...oMo..oMo.....',
  '..oMMo..oMMo....',
  '..oooo..oooo....',
];

const stove = [
  '................',
  '..oooooooooo....',
  '..ohhhhhhhho....',
  '.ohHxxxxxxHho...',
  '.ohxoRRRRoxho...',
  '.ohxRwRRRRxho...',
  '.ohxoRRRRoxho...',
  '.ohHxxxxxxHho...',
  '.ohhhhhhhhhho...',
  '.ohhhhhhhhhho...',
  '.oHxxHxxHxxHo...',
  '.ohhhhhhhhhho...',
  '.ohhhhhhhhhho...',
  '.oHhhhhhhhhhо...'.replace('о', 'o'),
  '..oooooooooo....',
  '................',
];

const barrel = [
  '................',
  '................',
  '....oooooo......',
  '...oTTTTTTo.....',
  '..oTtTTTTtTo....',
  '..oMMMMMMMMo....',
  '..oTtTTTTtTo....',
  '..oTTTTTTTTo....',
  '..oMMMMMMMMo....',
  '..oTtTTTTtTo....',
  '..oTTTTTTTTo....',
  '..oMMMMMMMMo....',
  '..oTtTTTTtTo....',
  '...oTTTTTTo.....',
  '....oooooo......',
  '................',
];

const candle = [
  '................',
  '......w.........',
  '.....owo........',
  '......o.........',
  '.....oYo........',
  '....ooYoo.......',
  '...oFYYYFo......',
  '...oFYYYFo......',
  '...oFFFFFo......',
  '...oFwFFFo......',
  '...oFFFFFo......',
  '...oFFFFFo......',
  '...oFFFFFo......',
  '....ooooo.......',
  '................',
  '................',
];

/* ── A 阶段已有家具（从 icon-grids 引用）── */
const { ICONS } = require('./icon-grids.cjs');
const bed = ICONS.ui_facility_dorm; // 宿舍床
const table = ICONS.ui_facility_lounge; // 招待区桌
const counter = ICONS.ui_room_front; // 吧台
const pot = ICONS.ui_facility_kitchen; // 炖锅

/* ── 32×32 场景合成：木地板底 + 2×2 家具（含 1px 间隙）── */

function gridToPng(grid, w, h) {
  const png = new PNG({ width: w, height: h });
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = PAL[ch];
      if (!c) throw new Error(`未知字符 '${ch}' @(${x},${y})`);
      const i = (w * y + x) * 4;
      png.data[i] = c[0];
      png.data[i + 1] = c[1];
      png.data[i + 2] = c[2];
      png.data[i + 3] = 255;
    }
  });
  return png;
}

/** 地板底（木色方格，浅缝） */
function floorTile(y0, x0) {
  const rows = [];
  for (let y = 0; y < 32; y++) {
    let row = '';
    for (let x = 0; x < 32; x++) {
      const plank = Math.floor(x / 8) + Math.floor(y / 16);
      row += (y % 16 === 15 || x % 8 === 7) ? 'M' : plank % 2 === 0 ? 'W' : 'T';
    }
    rows.push(row);
  }
  return rows;
}

/** 把 16×16 家具网格盖到 32×32 底板的指定象限（qx/qy ∈ {0,1}），带偏移与越界钳制 */
function composeScene(parts) {
  const bg = floorTile();
  const grid = bg.map((r) => r.split(''));
  for (const part of parts) {
    const src = part.grid;
    const ox = Math.max(0, Math.min(16, part.qx * 16 + (part.ox ?? 0)));
    const oy = Math.max(0, Math.min(16, part.qy * 16 + (part.oy ?? 0)));
    src.forEach((row, y) => {
      for (let x = 0; x < 16; x++) {
        if (row[x] === '.') continue;
        const gy = oy + y;
        const gx = ox + x;
        if (gy < 32 && gx < 32) grid[gy][gx] = row[x];
      }
    });
  }
  return grid.map((r) => r.join(''));
}

const SCENES = {
  /* 前台：吧台（左下）+ 烛台（右上）+ 木桶（右下） */
  scene_front: composeScene([
    { grid: counter, qx: 0, qy: 1 },
    { grid: candle, qx: 1, qy: 0, ox: 1, oy: 2 },
    { grid: barrel, qx: 1, qy: 1, ox: 2, oy: 1 },
  ]),
  /* 招待区：圆桌（左）+ 两把椅子（右上下） */
  scene_lounge: composeScene([
    { grid: table, qx: 0, qy: 0, oy: 1 },
    { grid: chair, qx: 1, qy: 0, ox: 1, oy: 3 },
    { grid: chair, qx: 1, qy: 1, ox: 1, oy: 1 },
  ]),
  /* 厨房：炉灶（左）+ 炖锅（右上）+ 木桶（右下） */
  scene_kitchen: composeScene([
    { grid: stove, qx: 0, qy: 0, oy: 1 },
    { grid: stove, qx: 0, qy: 1 },
    { grid: pot, qx: 1, qy: 0, ox: 1, oy: 1 },
    { grid: barrel, qx: 1, qy: 1, ox: 1, oy: 2 },
  ]),
  /* 宿舍：两张床（对角）+ 烛台 */
  scene_dorm: composeScene([
    { grid: bed, qx: 0, qy: 0 },
    { grid: bed, qx: 1, qy: 1 },
    { grid: candle, qx: 1, qy: 0, ox: 2, oy: 4 },
  ]),
};

fs.mkdirSync(FURN, { recursive: true });
for (const [name, grid] of Object.entries(SCENES)) {
  if (grid.length !== 32 || grid.some((r) => r.length !== 32)) {
    throw new Error(`${name}: 场景网格需 32×32`);
  }
  fs.writeFileSync(path.join(FURN, `${name}.png`), PNG.sync.write(gridToPng(grid, 32, 32)));
}
for (const [name, grid] of Object.entries({ ui_chair: chair, ui_stove: stove, ui_barrel: barrel, ui_candle: candle })) {
  fs.writeFileSync(path.join(UI, `${name}.png`), PNG.sync.write(gridToPng(grid, 16, 16)));
}
console.log(`房间场景 ${Object.keys(SCENES).length} 个 + 家具元素 4 个已输出`);

/* --dump 时输出 ASCII 自检 */
if (process.argv.includes('--dump')) {
  const { dumpPng } = require('./gen-icons.cjs');
  for (const name of Object.keys(SCENES)) {
    dumpPng(PNG.sync.read(fs.readFileSync(path.join(FURN, `${name}.png`))), name);
  }
}
