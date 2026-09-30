/* 手绘装饰 kit：战斗视口景深装饰（16×24 竖向道具 + 16×8 前景剪影带）
 * 产物 → public/sprites/dressing/（docs/STYLE.md §5 管线）
 * 运行：node assets/tools/gen-dressing.cjs [--dump]
 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'public', 'sprites', 'dressing');

const PAL = {
  o: [63, 38, 49],
  w: [255, 248, 236],
  Y: [240, 215, 140], G: [217, 164, 65], g: [168, 120, 48],
  W: [176, 138, 94], M: [138, 98, 68], m: [107, 74, 50],
  R: [232, 96, 76], r: [192, 57, 43], e: [122, 45, 34],
  L: [165, 212, 122], l: [124, 179, 66], k: [74, 107, 47],
  B: [168, 212, 232], b: [91, 143, 176], n: [58, 95, 122],
  C: [184, 236, 232], c: [110, 198, 192], q: [58, 122, 118],
  V: [179, 157, 219], v: [126, 87, 194], u: [78, 53, 129],
  H: [200, 200, 200], h: [138, 138, 138], x: [74, 74, 74],
  T: [200, 148, 104], t: [138, 90, 58],
};

function gridToPng(grid, w, h, name) {
  if (grid.length !== h) throw new Error(`${name}: 需 ${h} 行，实得 ${grid.length}`);
  const png = new PNG({ width: w, height: h });
  grid.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: 第 ${y} 行需 ${w} 列，实得 ${row.length} [${row}]`);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const c = PAL[ch];
      if (!c) throw new Error(`${name}: 未知字符 '${ch}' @(${x},${y})`);
      const i = (w * y + x) * 4;
      png.data[i] = c[0];
      png.data[i + 1] = c[1];
      png.data[i + 2] = c[2];
      png.data[i + 3] = 255;
    }
  });
  return png;
}

const recolor = (grid, map) => grid.map((r) => r.replace(/[1234]/g, (ch) => map[ch] ?? ch));

/* ── 立柱模板（1=亮面 2=中面 3=暗面 4=顶饰）── */
const PILLAR = [
  '....oooooooo....',
  '...o22222222o...',
  '..o1122112211o..',
  '..o1122112211o..',
  '..o2222222222o..',
  '...o44444444o...',
  '...o3223o3223o..'.slice(0, 16),
  '...o32o22o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o32o11o32o...',
  '...o3223o3223o..'.slice(0, 16),
  '..o2222222222o..',
  '..o1122112211o..',
  '..o2222222222o..',
  '...oooooooooo...',
  '................',
];

/* ── 石笋（1=亮 2=中 3=暗）── */
const STALAGMITE = [
  '.......o........',
  '......o2o.......',
  '......o2o.......',
  '.....o21o.......',
  '.....o21o..o....',
  '.....o211o.o2o..',
  '....o2111oo21o..',
  '....o21122111o..',
  '....o21122111o..',
  '...o2111221111o.',
  '...o2112221111o.',
  '...o211222111o..',
  '..o21122222111o.',
  '..o21222222111o.',
  '..o21222332111o.',
  '.o212223332111o.',
  '.o21222333211oo.',
  '.o212233332111o.',
  'o2112233333111o.',
  'o2122233333211o.',
  'o2122233333211o.',
  'o2122233333211o.',
  'oo22333333321oo.',
  '..ooooooooooo...',
];

/* ── 火把（杆=木 火焰=R/r/w）── */
const TORCH = [
  '......oo........',
  '.....owRo.......',
  '.....oRRo.......',
  '....oRRRRo......',
  '....oRwwRo......',
  '....oRRwRo......',
  '.....oRRo.......',
  '.....oeeo.......',
  '....oooooo......',
  '....oMMo........',
  '....oMMo........',
  '....oMMo........',
  '....oMMo........',
  '....oMMo........',
  '....oMMo........',
  '....oMMo........',
  '...oMMMMo.......',
  '...oMWWMo.......',
  '...oMMMMo.......',
  '...oooooo.......',
  '................',
  '................',
  '................',
  '................',
];

/* ── 晶簇（1=亮 2=中 3=暗）── */
const CRYSTAL_CLUSTER = [
  '......o.........',
  '.....o1o........',
  '.....o1o...o....',
  '.....o11o.o1o...',
  '....o111oo11o...',
  '....o1122o11o...',
  '....o112o111o...',
  '...o1112o1111o..',
  '...o1112o1111o..',
  '..o11122o11111o.',
  '..o11122211111o.',
  '..o1112221111o..',
  '.o111223321111o.',
  '.o111223332111o.',
  '.o111223333211o.',
  '.o11122333321oo.',
  'o1112233333211o.',
  'o1112233333211o.',
  'o1122233333321o.',
  'o1222233333321o.',
  'oo22233333332oo.',
  '.oo223333333oo..',
  '...oooooooooo...',
  '................',
];

/* ── 骨堆 ── */
const BONE_PILE = [
  '................',
  '................',
  '.....oo...oo....',
  '....oHHo.oHHo...',
  '....oHHo.oHHo...',
  '...oHxHHoHHxHo..',
  '...oHHHHHHHHo...',
  '....oHHooooHo...',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..oHxHHHHHHxHo..',
  '.oHHHHHHHHHHHHo.',
  '.oHHHooHHHooHHo.',
  'oHHHHHHHHHHHHHHo',
  'oHxHHHhhHHHhhHHo',
  'oHHHhhHHHHHhhHHo',
  'oHHhhHHHHHHHhhHo',
  'oHHhhhhhHHHhhhHo',
  'ohhhhhhhhhhhhhho',
  'ohhhhhhhhhhhhhho',
  'oooooooooooooooo',
  '................',
  '................',
  '................',
];

/* ── 黑曜碑（1=符文亮 2=碑面 3=暗面）── */
const MONOLITH = [
  '.....oooooo.....',
  '....o322223o....',
  '....o321123o....',
  '....o321123o....',
  '....o322223o....',
  '....o322223o....',
  '....o321123o....',
  '....o322223o....',
  '....o322223o....',
  '....o322223o....',
  '....o321123o....',
  '....o322223o....',
  '....o322223o....',
  '....o321123o....',
  '....o322223o....',
  '....o322223o....',
  '....o322223o....',
  '....o321123o....',
  '....o322223o....',
  '...o32222223o...',
  '..o3322222233o..',
  '..oooooooooooo..',
  '................',
  '................',
];

/* ── 墓碑 ── */
const TOMBSTONE = [
  '.....oooooo.....',
  '...oo222222oo...',
  '..o2222222222o..',
  '..o2211111122o..',
  '..o2111111112o..',
  '..o2111111112o..',
  '..o2211111122o..',
  '..o2221111222o..',
  '..o2221111222o..',
  '..o2211111122o..',
  '..o2211111122o..',
  '..o2221111222o..',
  '..o2221111222o..',
  '..o2222222222o..',
  '..o2333333332o..',
  '..o3333333333o..',
  '.o222222222222o.',
  '.o333333333333o.',
  'o22222222222222o',
  'o33333333333333o',
  'oooooooooooooooo',
  '................',
  '................',
  '................',
];

/* ── 前景剪影带（16×8，1=受光 2=中 3=暗）── */
const FG_ROCK = [
  '................',
  '........o.......',
  '...oo..o2o..o...',
  '..o21o.o22o.o1o.',
  '..o22oo122oo11o.',
  '.o1222221222211o',
  'o12333322333321o',
  'oooooooooooooooo',
];

/* ── 主题配色 ── */
const THEME_STONE = {
  mossy: { 1: 'H', 2: 'h', 3: 'x', 4: 'L' },
  timber: { 1: 'W', 2: 'M', 3: 'm', 4: 'W' },
  crypt: { 1: 'H', 2: 'h', 3: 'x', 4: 'H' },
  ember: { 1: 'T', 2: 't', 3: 'e', 4: 'r' },
  crystal: { 1: 'B', 2: 'b', 3: 'n', 4: 'C' },
  void: { 1: 'V', 2: 'v', 3: 'u', 4: 'V' },
};

const FILES = {
  // map1 苔藓洞窟
  'stalagmite_mossy': recolor(STALAGMITE, { 1: 'H', 2: 'h', 3: 'x' }),
  'pillar_moss': recolor(PILLAR, THEME_STONE.mossy),
  // map2 秘银矿道
  'pillar_timber': recolor(PILLAR, THEME_STONE.timber),
  'torch': TORCH,
  // map3 骸骨墓穴
  'tombstone': recolor(TOMBSTONE, { 1: 'h', 2: 'H', 3: 'x' }),
  'bone_pile': BONE_PILE,
  // map4 熔岩裂隙
  'stalagmite_ember': recolor(STALAGMITE, { 1: 'T', 2: 't', 3: 'e' }),
  // map5 水晶回廊
  'crystal_cluster': recolor(CRYSTAL_CLUSTER, { 1: 'C', 2: 'c', 3: 'q' }),
  'pillar_crystal': recolor(PILLAR, THEME_STONE.crystal),
  // map6 虚空终焉
  'monolith': recolor(MONOLITH, { 1: 'Y', 2: 'v', 3: 'u' }),
  'crystal_cluster_void': recolor(CRYSTAL_CLUSTER, { 1: 'V', 2: 'v', 3: 'u' }),
};

/* 前景带 ×6 主题（低明度剪影） */
const FG_THEMES = {
  mossy: { 1: 'k', 2: 'k', 3: 'o' },
  timber: { 1: 'm', 2: 'm', 3: 'o' },
  crypt: { 1: 'x', 2: 'x', 3: 'o' },
  ember: { 1: 'e', 2: 'e', 3: 'o' },
  crystal: { 1: 'q', 2: 'q', 3: 'o' },
  void: { 1: 'u', 2: 'u', 3: 'o' },
};

fs.mkdirSync(OUT, { recursive: true });
let count = 0;
for (const [name, grid] of Object.entries(FILES)) {
  fs.writeFileSync(path.join(OUT, `${name}.png`), PNG.sync.write(gridToPng(grid, 16, 24, name)));
  count++;
}
for (const [theme, map] of Object.entries(FG_THEMES)) {
  fs.writeFileSync(
    path.join(OUT, `fg_rock_${theme}.png`),
    PNG.sync.write(gridToPng(recolor(FG_ROCK, map), 16, 8, `fg_rock_${theme}`)),
  );
  count++;
}
console.log(`装饰件 ${count} 个已输出 → public/sprites/dressing/`);

if (process.argv.includes('--dump')) {
  const { dumpPng, lenientRead } = require('./gen-icons.cjs');
  for (const name of ['pillar_moss', 'stalagmite_mossy', 'torch', 'crystal_cluster', 'monolith', 'fg_rock_crypt']) {
    dumpPng(PNG.sync.read(lenientRead(path.join(OUT, `${name}.png`))), name);
  }
}
