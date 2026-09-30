/* 精英变体生成器：基础魔物 PNG → 金色轮廓 + 提亮提饱和 + 顶部王冠 → elite 贴图
 * 产物 → public/sprites/monsters/{eliteId}.png（36 个，按 monsters.ts 的 EliteDef）
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..', '..');
const MON_DIR = path.join(ROOT, 'public', 'sprites', 'monsters');

const OUTLINE = [63, 38, 49]; // 原轮廓 #3f2631
const ELITE_FRAME = [138, 106, 42]; // 精英金框 #8a6a2a
const GOLD = [217, 164, 65]; // 王冠 #d9a441

/** 王冠 5×5（o=金框暗色 Y=金 w=高光） */
const CROWN = [
  'o.o.o',
  'oYoYo',
  'oYwYo',
  'oYYYo',
  'ooooo',
];
const CROWN_PAL = { o: ELITE_FRAME, Y: GOLD, w: [240, 215, 140] };

/* 精英魔物（原生 BOSS，elitePool: MonsterId[]；base = 自身） */
const ELITES = [
  'slime_king', 'bat_lord', 'crab_king', 'wolf_alpha',
  'golem_guard', 'weaver_queen',
  'skeleton_captain',
  'troll_warlord', 'wraith_lord', 'nightmare',
  'crystal_mother', 'gem_titan', 'void_weaver', 'frost_basilisk', 'crystal_beetle_king',
  'elder_flayer', 'void_reaper', 'crystal_dragon', 'shade_lord', 'the_void_heart',
];

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

function makeElite(base) {
  const png = PNG.sync.read(fs.readFileSync(path.join(MON_DIR, `${base}.png`)));
  const { data } = png;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 32) continue;
    // 1. 轮廓 → 精英金框
    if (data[i] === OUTLINE[0] && data[i + 1] === OUTLINE[1] && data[i + 2] === OUTLINE[2]) {
      data[i] = ELITE_FRAME[0];
      data[i + 1] = ELITE_FRAME[1];
      data[i + 2] = ELITE_FRAME[2];
      continue;
    }
    // 2. 主体提饱和 +8% / 提亮 +6%
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2]);
    const [r, g, b] = hslToRgb(h, Math.min(1, s * 1.08 + 0.02), Math.min(1, l * 1.06 + 0.02));
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  // 3. 王冠盖顶（居中，覆盖头部轮廓线）
  const cx = 5, cy = 0;
  CROWN.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = CROWN_PAL[ch];
      const i = (16 * (cy + y) + cx + x) * 4;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = 255;
    }
  });
  return png;
}

for (const id of ELITES) {
  fs.writeFileSync(path.join(MON_DIR, `elite_${id}.png`), PNG.sync.write(makeElite(id)));
}
console.log(`精英变体 ${ELITES.length} 个已输出`);

if (process.argv.includes('--dump')) {
  const { dumpPng, lenientRead } = require('./gen-icons.cjs');
  for (const id of ELITES.slice(0, 4)) {
    dumpPng(PNG.sync.read(lenientRead(path.join(MON_DIR, `elite_${id}.png`))), `elite_${id}`);
  }
}
