/* 程序化像素图标生成器（详见 docs/STYLE.md §5）
 * - 自绘图：16×16 字符网格 → PNG，全局锁定调色板，轮廓 #3f2631 对齐 Tiny Creatures
 * - 素材包加工：oga-16x16-food 图标描边加深 + 外扩 1px → Tiny 风 2px 轮廓，重编码为干净 PNG
 * 用法：node gen-icons.cjs [--dump]
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..', '..');
const ITEMS = path.join(ROOT, 'public', 'sprites', 'items');
const UI = path.join(ROOT, 'public', 'sprites', 'ui');
const FOOD_SRC = path.join(ROOT, 'assets', 'packs', 'oga-16x16-food', 'food');

const OUTLINE = [63, 38, 49]; // #3f2631

/* ── 全局调色板（STYLE.md §2；字符→RGBA，全图标共用）── */
const PAL = {
  o: [63, 38, 49], // 轮廓（与 Tiny Creatures 描边同色）
  w: [255, 248, 236], // 高光白
  F: [240, 230, 210], // 羊皮纸
  Y: [240, 215, 140], G: [217, 164, 65], g: [168, 120, 48], // 金
  W: [176, 138, 94], M: [138, 98, 68], m: [107, 74, 50], // 木
  R: [232, 96, 76], r: [192, 57, 43], e: [122, 45, 34], // 红
  L: [165, 212, 122], l: [124, 179, 66], k: [74, 107, 47], // 绿
  B: [168, 212, 232], b: [91, 143, 176], n: [58, 95, 122], // 蓝
  C: [184, 236, 232], c: [110, 198, 192], q: [58, 122, 118], // 青
  V: [179, 157, 219], v: [126, 87, 194], u: [78, 53, 129], // 紫
  H: [200, 200, 200], h: [138, 138, 138], x: [74, 74, 74], // 灰
  T: [200, 148, 104], t: [138, 90, 58], // 棕
  s: [42, 32, 40], // 极暗阴影
};

/* ── PNG 工具 ── */

/** 宽容读取：剥离 IEND 后的尾部垃圾字节（oga 包存在 0-2 字节） */
function lenientRead(file) {
  const buf = fs.readFileSync(file);
  const iend = buf.indexOf(Buffer.from('IEND'));
  if (iend > 0 && buf.length > iend + 8) return buf.subarray(0, iend + 8);
  return buf;
}

function gridToPng(grid, name) {
  if (grid.length !== 16) throw new Error(`${name}: 需要 16 行，实得 ${grid.length}`);
  const png = new PNG({ width: 16, height: 16 });
  grid.forEach((row, y) => {
    if (row.length !== 16) throw new Error(`${name}: 第 ${y} 行需 16 列，实得 ${row.length}`);
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      const i = (16 * y + x) * 4;
      if (ch === '.') continue;
      const c = PAL[ch];
      if (!c) throw new Error(`${name}: 未知调色板字符 '${ch}' @(${x},${y})`);
      png.data[i] = c[0];
      png.data[i + 1] = c[1];
      png.data[i + 2] = c[2];
      png.data[i + 3] = 255;
    }
  });
  return png;
}

/** 邻接透明的像素中最高频的颜色 → 视为描边色，精确重映射为 OUTLINE（内部同色同步加深） */
function darkenOutlineRing(png) {
  const { width, height, data } = png;
  const counts = new Map();
  const isTransparent = (x, y) => x < 0 || y < 0 || x >= width || y >= height || data[(width * y + x) * 4 + 3] < 32;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) * 4;
      if (data[i + 3] < 32) continue;
      if (isTransparent(x + 1, y) || isTransparent(x - 1, y) || isTransparent(x, y + 1) || isTransparent(x, y - 1)) {
        const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  const ring = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (!ring) return;
  const [r, g, b] = ring[0].split(',').map(Number);
  const lum = 0.3 * r + 0.6 * g + 0.1 * b;
  if (lum > 130) return; // 最外环是亮色（如高光描边）则不动
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === r && data[i + 1] === g && data[i + 2] === b) {
      data[i] = OUTLINE[0];
      data[i + 1] = OUTLINE[1];
      data[i + 2] = OUTLINE[2];
    }
  }
}

/** 四邻域外扩 1px 深轮廓（对齐 export3.cjs 的 layer2 手法）；贴边时跳过 */
function expandOutline(png) {
  const { width, height, data } = png;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(width * y + x) * 4 + 3] >= 32) return false; // 贴边 → 不可外扩
    }
  }
  const marks = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) * 4;
      if (data[i + 3] >= 32) continue;
      const touch = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < width && ny < height && data[(width * ny + nx) * 4 + 3] >= 32;
      });
      if (touch) marks.push(i);
    }
  }
  for (const i of marks) {
    data[i] = OUTLINE[0];
    data[i + 1] = OUTLINE[1];
    data[i + 2] = OUTLINE[2];
    data[i + 3] = 255;
  }
  return true;
}

/** oga 食物图标 → 描边加深(+外扩) → 干净 PNG */
function processCurated(srcName, outName) {
  const png = PNG.sync.read(lenientRead(path.join(FOOD_SRC, srcName)));
  darkenOutlineRing(png);
  expandOutline(png);
  const dir = outName.startsWith('ui_') ? UI : ITEMS;
  fs.writeFileSync(path.join(dir, outName), PNG.sync.write(png));
  return outName;
}

/* ── dump（与 dump.cjs 同构，供自检）── */
function dumpPng(png, name) {
  const { width, height, data } = png;
  console.log(`=== ${name} ===`);
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) * 4;
      const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a < 32) { row += '.'; continue; }
      const lum = 0.3 * r + 0.6 * g + 0.1 * b;
      if (lum < 55) row += '#';
      else if (lum < 115) row += 'x';
      else if (r > g + 40 && r > b + 40) row += 'R';
      else if (g > r + 40 && g > b + 40) row += 'G';
      else if (b > r + 40 && b > g + 40) row += 'B';
      else if (r > 150 && g > 150 && b < 120) row += 'Y';
      else row += 'o';
    }
    console.log(row);
  }
}

module.exports = { ROOT, ITEMS, UI, PAL, OUTLINE, lenientRead, gridToPng, processCurated, dumpPng, PNG, fs, path };

/* 直接运行时输出全部图标（被 require 时静默，供网格定义模块复用） */
if (require.main === module) {
  const { ICONS, CURATED } = require('./icon-grids.cjs');
  const dumpMode = process.argv.includes('--dump');
  for (const [name, grid] of Object.entries(ICONS)) {
    const png = gridToPng(grid, name);
    const dir = name.startsWith('ui_') ? UI : ITEMS;
    fs.writeFileSync(path.join(dir, `${name}.png`), PNG.sync.write(png));
    if (dumpMode) dumpPng(png, name);
  }
  console.log(`自绘图标 ${Object.keys(ICONS).length} 个已输出`);
  for (const [entity, src] of Object.entries(CURATED)) {
    const out = processCurated(src, `${entity}.png`);
    if (dumpMode) dumpPng(PNG.sync.read(lenientRead(path.join(ITEMS, `${entity}.png`))), out);
  }
  console.log(`素材包加工图标 ${Object.keys(CURATED).length} 个已输出`);
}
