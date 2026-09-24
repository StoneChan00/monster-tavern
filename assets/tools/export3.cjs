/* 最终导出器：从 packed sheet 17x17 格切片
 * - 棕底格：仅抠边框连通的棕色 → 紫描边完好
 * - 紫底格：洪泛抠紫（含描边）→ 8 邻域膨胀 2px 重建描边 → 回填内部孔洞
 * - 按生物 bbox 居中裁到 16x16
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = 'D:/2_Projects/github/StoneChan00/monster-tavern';
const SHEET = `${ROOT}/assets/packs/clint-tiny-creatures/tiny-creatures/Tilemap/tilemap.png`;
const sheet = PNG.sync.read(fs.readFileSync(SHEET));

const PURPLE = [63, 38, 49];
const BROWN = [118, 59, 54];
const isColor = (d, i, c) => d[i] === c[0] && d[i + 1] === c[1] && d[i + 2] === c[2];

/** 导出第 n 号生物（1-based，与 Tilesheet.txt 顺序一致） */
function exportCreature(n) {
  const idx = n - 1;
  const col = idx % 10;
  const row = Math.floor(idx / 10);
  const W = 17;
  const png = new PNG({ width: W, height: W });
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const si = (sheet.width * (row * W + y) + (col * W + x)) * 4;
      const di = (W * y + x) * 4;
      png.data[di] = sheet.data[si];
      png.data[di + 1] = sheet.data[si + 1];
      png.data[di + 2] = sheet.data[si + 2];
      png.data[di + 3] = 255;
    }
  }

  // ── 1. 边框环统计背景色 ──
  let pRing = 0, bRing = 0;
  const ringIdx = [];
  for (let k = 0; k < W; k++) ringIdx.push([k, 0], [k, W - 1], [0, k], [W - 1, k]);
  for (const [x, y] of ringIdx) {
    const i = (W * y + x) * 4;
    if (isColor(png.data, i, PURPLE)) pRing++;
    else if (isColor(png.data, i, BROWN)) bRing++;
  }
  const bgColors = [];
  if (pRing / ringIdx.length >= 0.25) bgColors.push(PURPLE);
  if (bRing / ringIdx.length >= 0.25) bgColors.push(BROWN);
  const purpleBg = bgColors.includes(PURPLE);

  // ── 2. 洪泛：从边框沿背景色连通抠除 ──
  const isBg = (x, y) => {
    const i = (W * y + x) * 4;
    return png.data[i + 3] === 255 && bgColors.some((c) => isColor(png.data, i, c));
  };
  const stack = [];
  for (let k = 0; k < W; k++) stack.push([k, 0], [k, W - 1], [0, k], [W - 1, k]);
  const seen = new Set();
  while (stack.length) {
    const [x, y] = stack.pop();
    const key = x + ',' + y;
    if (x < 0 || y < 0 || x >= W || y >= W || seen.has(key)) continue;
    if (!isBg(x, y)) continue;
    seen.add(key);
    png.data[(W * y + x) * 4 + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // ── 3. 紫底格：还原描边（原位第一层 + 1px 外扩第二层）+ 回填内部孔洞 ──
  if (purpleBg) {
    // 3a. 被洪泛抠掉的紫色像素，凡 8 邻接存活像素 → 原位恢复（= 原描边内层，保真轮廓）
    const layer1 = [];
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const i = (W * y + x) * 4;
        if (png.data[i + 3] !== 0 || !isColor(png.data, i, PURPLE)) continue;
        let touch = false;
        for (let dy = -1; dy <= 1 && !touch; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= W || (dx === 0 && dy === 0)) continue;
            if (png.data[(W * ny + nx) * 4 + 3] === 255) { touch = true; break; }
          }
        }
        if (touch) layer1.push(i);
      }
    }
    for (const i of layer1) {
      png.data[i + 3] = 255;
    }
    // 3b. 第二层：四邻域外扩 1px（合成描边外层）
    const layer2 = [];
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const i = (W * y + x) * 4;
        if (png.data[i + 3] !== 0) continue;
        let touch = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= W) continue;
          if (png.data[(W * ny + nx) * 4 + 3] === 255) { touch = true; break; }
        }
        if (touch) layer2.push(i);
      }
    }
    for (const i of layer2) {
      png.data[i] = PURPLE[0]; png.data[i + 1] = PURPLE[1]; png.data[i + 2] = PURPLE[2]; png.data[i + 3] = 255;
    }
    // 3c. 回填封闭孔洞（被误抠的内部细节：眼睛等）
    const holeFilled = [];
    for (let y = 1; y < W - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = (W * y + x) * 4;
        if (png.data[i + 3] !== 0) continue;
        let enclosed = true;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          if (png.data[(W * (y + dy) + (x + dx)) * 4 + 3] !== 255) { enclosed = false; break; }
        }
        if (enclosed) holeFilled.push(i);
      }
    }
    for (const i of holeFilled) {
      png.data[i] = PURPLE[0]; png.data[i + 1] = PURPLE[1]; png.data[i + 2] = PURPLE[2]; png.data[i + 3] = 255;
    }
  }

  // ── 4. bbox 居中裁剪到 16x16 ──
  let minX = W, minY = W, maxX = -1, maxY = -1;
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      if (png.data[(W * y + x) * 4 + 3] === 255) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { ok: false, note: 'empty' };
  let bw = maxX - minX + 1, bh = maxY - minY + 1;
  // bbox 超过 16：居中裁掉多余边缘（上下/左右对称去）
  if (bw > 16) {
    const cut = bw - 16;
    minX += Math.ceil(cut / 2);
    maxX -= Math.floor(cut / 2);
    bw = 16;
  }
  if (bh > 16) {
    const cut = bh - 16;
    minY += Math.ceil(cut / 2);
    maxY -= Math.floor(cut / 2);
    bh = 16;
  }
  const out = new PNG({ width: 16, height: 16 });
  const ox = Math.floor((16 - bw) / 2) - minX;
  const oy = Math.floor((16 - bh) / 2) - minY;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const di = (16 * y + x) * 4;
      const sx = x - ox, sy = y - oy;
      if (sx < 0 || sy < 0 || sx >= W || sy >= W) continue;
      const si = (W * sy + sx) * 4;
      out.data[di] = png.data[si]; out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2]; out.data[di + 3] = png.data[si + 3];
    }
  }
  let opaque = 0;
  for (let i = 3; i < out.data.length; i += 4) if (out.data[i] === 255) opaque++;
  return { ok: true, png: out, opaquePct: Math.round((opaque / 256) * 100), bg: purpleBg ? 'P' : 'B' };
}

const classes = { warrior: 19, mage: 101, priest: 36, rogue: 94, ranger: 22, bard: 102 };
const monsters = {
  slime: 85, big_slime: 82, slime_king: 87, mushroom: 14, spore_mushroom: 115,
  bat: 139, venom_bat: 142, bat_lord: 3, rock_crab: 146, crab_king: 144,
  moss_wolf: 24, wolf_alpha: 25, cave_lizard: 147,
  glow_jelly: 90, stone_golem: 128, golem_guard: 127, shadow_spider: 29,
  iron_beetle: 145, weaver_queen: 8, skeleton: 2, skeleton_captain: 20, man_eater: 9,
  acid_slime: 83, cave_troll: 43, troll_warlord: 15, wraith: 5, shadow_hunter: 95,
  basilisk: 149, abyss_tentacle: 113, obsidian_golem: 129, wraith_lord: 97, nightmare: 55,
  crystal_slime: 81, crystal_bat: 140, crystal_mother: 84, void_spider: 29,
  ice_lizard: 150, gem_golem: 127, gem_titan: 129, amethyst_beetle: 143,
  crystal_beetle_king: 144, void_weaver: 122, frost_basilisk: 77,
  mind_flayer: 66, elder_flayer: 121, void_wraith: 99, purple_worm: 76,
  nightmare_shade: 100, void_heart_larva: 37, crystal_dragon: 32,
  shade_lord: 39, void_reaper: 98, the_void_heart: 38,
};

const argv = process.argv.slice(2);
const targets = argv.length > 0 ? Object.fromEntries(argv.map((a) => a.split('='))) : { ...classes, ...monsters };

const report = [];
for (const [name, n] of Object.entries(targets)) {
  const r = exportCreature(n);
  if (!r.ok) { report.push(`${name}: FAIL ${r.note}`); continue; }
  const dir = name in classes ? 'public/sprites/classes' : 'public/sprites/monsters';
  fs.writeFileSync(path.join(ROOT, dir, `${name}.png`), PNG.sync.write(r.png));
  report.push(`${name}: bg${r.bg} opaque=${r.opaquePct}%`);
}
console.log(report.join('\n'));
