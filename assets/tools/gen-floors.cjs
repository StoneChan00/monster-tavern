/**
 * 程序化无缝地板生成器：6 主题 × 3 变体（基底A / 基底B / 点缀）。
 * 16×16、调色板直出（无 tint）、印记避让边缘 1px —— 拼接零缝隙。
 * 产出：public/sprites/tiles/floor_<theme>_{1,2,3}.png
 *
 * 用法：node assets/tools/gen-floors.cjs
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const OUT = path.join(__dirname, '..', '..', 'public', 'sprites', 'tiles');

/** 主题调色板：base 底色 / dark 深色斑 / light 浅色斑 / glow 点缀亮色 */
const THEMES = {
  mossy:   { base: [92, 112, 78],   dark: [76, 94, 64],    light: [110, 132, 94],  glow: [132, 168, 104] },
  mine:    { base: [104, 110, 124], dark: [88, 94, 108],   light: [122, 129, 145], glow: [168, 190, 214] },
  crypt:   { base: [96, 92, 106],   dark: [80, 77, 90],    light: [114, 109, 125], glow: [178, 170, 196] },
  lava:    { base: [124, 84, 66],   dark: [102, 66, 50],   light: [146, 102, 78],  glow: [236, 128, 64] },
  crystal: { base: [88, 112, 130],  dark: [72, 93, 110],   light: [106, 134, 154], glow: [150, 214, 232] },
  void:    { base: [76, 70, 96],    dark: [62, 57, 80],    light: [92, 85, 116],   glow: [164, 120, 208] },
};

/** 确定性 PRNG（mulberry32）：同种子同图案 */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function put(px, x, y, c) {
  const i = (16 * y + x) * 4;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
}

/** 生成一个变体：base 底 + 深浅斑块（2x2/1x1 混合，避让边缘） */
function makeTile(theme, variant) {
  const pal = THEMES[theme];
  const png = new PNG({ width: 16, height: 16 });
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = pal.base[0]; png.data[i + 1] = pal.base[1]; png.data[i + 2] = pal.base[2]; png.data[i + 3] = 255;
  }
  const rand = rng(
    [...theme].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) | 0, variant * 7919),
  );
  const marks = variant === 1 ? 5 : variant === 2 ? 9 : 6; // 基底A 稀疏 / 基底B 密 / 点缀 中等
  for (let m = 0; m < marks; m++) {
    const x = 1 + Math.floor(rand() * 14);
    const y = 1 + Math.floor(rand() * 14);
    const c = rand() < 0.65 ? pal.dark : pal.light;
    const size = rand() < 0.5 ? 1 : 2;
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        if (x + dx < 15 && y + dy < 15) put(png.data, x + dx, y + dy, c);
      }
    }
  }
  // 点缀变体（3 号）：主题纹样 —— 裂缝（暗色折线）/ 亮斑簇 / 纹章点
  if (variant === 3) {
    const kind = Math.floor(rand() * 3);
    if (kind === 0) {
      // 裂缝：从随机点向两个方向的暗色折线
      let x = 3 + Math.floor(rand() * 8);
      let y = 3 + Math.floor(rand() * 8);
      const len = 7 + Math.floor(rand() * 4);
      for (let s = 0; s < len; s++) {
        put(png.data, Math.min(14, x), Math.min(14, y), pal.dark);
        x += rand() < 0.6 ? 1 : 0;
        y += rand() < 0.5 ? 1 : -1;
        if (x > 14 || y < 1 || y > 14) break;
      }
    } else if (kind === 1) {
      // 亮斑簇：glow 色 2x2 + 周围光晕点
      const cx = 3 + Math.floor(rand() * 9);
      const cy = 3 + Math.floor(rand() * 9);
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) put(png.data, cx + dx, cy + dy, pal.glow);
      put(png.data, cx - 1, cy, pal.light);
      put(png.data, cx + 2, cy + 1, pal.light);
    } else {
      // 卵石纹：三块 2x2 深斑带浅色高光角
      for (let n = 0; n < 3; n++) {
        const x = 2 + Math.floor(rand() * 11);
        const y = 2 + Math.floor(rand() * 11);
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) put(png.data, x + dx, y + dy, pal.dark);
        put(png.data, x, y, pal.light);
      }
    }
  }
  return png;
}

fs.mkdirSync(OUT, { recursive: true });
let count = 0;
for (const theme of Object.keys(THEMES)) {
  for (let variant = 1; variant <= 3; variant++) {
    const file = path.join(OUT, `floor_${theme}_${variant}.png`);
    fs.writeFileSync(file, PNG.sync.write(makeTile(theme, variant)));
    count++;
  }
}
console.log(`generated ${count} seamless floor tiles -> public/sprites/tiles/`);
