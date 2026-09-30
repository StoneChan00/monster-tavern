/* AI 背景板量化管线：任意源图 → 裁切中带 → 盒降采样 → 游戏调色板量化 → 压暗
 * 用法：node gen-backdrops.cjs <src.png> <out.png> [--wide 256] [--dark 0.8]
 * 产物规格：宽 ~256 逻辑像素的横向条带（BattleViewport 镜像平铺 ×2 显示）
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const GAME_PALETTE = [
  [63, 38, 49], [42, 32, 40],
  [255, 248, 236], [240, 230, 210],
  [240, 215, 140], [217, 164, 65], [168, 120, 48],
  [176, 138, 94], [138, 98, 68], [107, 74, 50],
  [232, 96, 76], [192, 57, 43], [122, 45, 34],
  [165, 212, 122], [124, 179, 66], [74, 107, 47],
  [168, 212, 232], [91, 143, 176], [58, 95, 122],
  [184, 236, 232], [110, 198, 192], [58, 122, 118],
  [179, 157, 219], [126, 87, 194], [78, 53, 129],
  [200, 200, 200], [138, 138, 138], [74, 74, 74],
  [200, 148, 104], [138, 90, 58],
  [90, 70, 78], [70, 55, 62], [50, 40, 46], [36, 30, 34],
  [46, 62, 46], [38, 52, 66], [52, 42, 62], [66, 44, 40], [60, 60, 48],
].map(([r, g, b]) => [r, g, b]);

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function quantize(r, g, b) {
  let best = GAME_PALETTE[0];
  let bd = Infinity;
  for (const c of GAME_PALETTE) {
    const d = dist2([r, g, b], c);
    if (d < bd) {
      bd = d;
      best = c;
    }
  }
  return best;
}

/** 盒降采样（面积平均，抗锯齿后仍保持色块平整） */
function boxDownscale(png, factor) {
  const w = Math.floor(png.width / factor);
  const h = Math.floor(png.height / factor);
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = (png.width * (y * factor + dy) + x * factor + dx) * 4;
          if (png.data[i + 3] < 32) continue;
          r += png.data[i];
          g += png.data[i + 1];
          b += png.data[i + 2];
          n++;
        }
      }
      const i = (w * y + x) * 4;
      if (n === 0) {
        out.data[i + 3] = 0;
        continue;
      }
      const [qr, qg, qb] = quantize(r / n, g / n, b / n);
      out.data[i] = qr;
      out.data[i + 1] = qg;
      out.data[i + 2] = qb;
      out.data[i + 3] = 255;
    }
  }
  return out;
}

/** 方图/高图 → 裁 8:1 中带（产出 256×32 逻辑 = 64 显示像素墙带） */
function cropBand(png) {
  const bandH = Math.min(png.height, Math.floor(png.width / 8));
  if (bandH >= png.height) return png;
  const y0 = Math.floor((png.height - bandH) / 2);
  const out = new PNG({ width: png.width, height: bandH });
  PNG.bitblt(png, out, 0, y0, png.width, bandH, 0, 0);
  return out;
}

const args = process.argv.slice(2);
const src = args[0];
const outPath = args[1];
const wideIdx = args.indexOf('--wide');
const targetW = wideIdx >= 0 ? Number(args[wideIdx + 1]) : 256;
const darkIdx = args.indexOf('--dark');
const darken = darkIdx >= 0 ? Number(args[darkIdx + 1]) : 0.8;

if (!src || !outPath) {
  console.error('用法: node gen-backdrops.cjs <src.png> <out.png> [--wide 256] [--dark 0.8]');
  process.exit(1);
}

let png = PNG.sync.read(fs.readFileSync(src));
if (png.height / png.width > 0.2) png = cropBand(png); // 非横条带 → 裁 8:1 中带
const factor = Math.max(1, Math.floor(png.width / targetW));
let out = boxDownscale(png, factor);

if (darken < 1) {
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = Math.round(out.data[i] * darken);
    out.data[i + 1] = Math.round(out.data[i + 1] * darken);
    out.data[i + 2] = Math.round(out.data[i + 2] * darken);
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, PNG.sync.write(out));
const colors = new Set();
for (let i = 0; i < out.data.length; i += 4) colors.add(`${out.data[i]},${out.data[i + 1]},${out.data[i + 2]}`);
console.log(`${outPath}: ${out.width}×${out.height}（${factor}× 降采样，${colors.size} 色，压暗 ${darken}）`);
