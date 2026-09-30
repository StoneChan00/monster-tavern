/* 素材总览页生成器：扫描 public/sprites/* → public/gallery.html
 * 部署后访问 https://<site>/gallery.html（相对路径，dev 与 Pages 通用）
 * 运行：node assets/tools/make-gallery.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SPRITES = path.join(ROOT, 'public', 'sprites');
const OUT = path.join(ROOT, 'public', 'gallery.html');

/** 从数据 TS 提取 id→中文名映射 */
function nameMap(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf-8');
  const map = {};
  const re = /id: '([^']+)',\s*\n\s*name: '([^']+)'/g;
  let m;
  while ((m = re.exec(src))) map[m[1]] = m[2];
  return map;
}

const NAMES = {
  ...nameMap('src/data/monsters.ts'),
  ...nameMap('src/data/materials.ts'),
  ...nameMap('src/data/recipes.ts'),
  ...nameMap('src/data/achievements.ts'),
  ...nameMap('src/data/races.ts'),
  ...nameMap('src/data/classes.ts'),
  ...nameMap('src/data/upgrades.ts'),
};

const pngs = (dir) =>
  fs
    .readdirSync(path.join(SPRITES, dir))
    .filter((f) => f.endsWith('.png'))
    .sort();

function rawPngs(dir) {
  return fs.existsSync(path.join(SPRITES, dir)) ? pngs(dir) : [];
}

const stem = (f) => f.replace(/\.png$/, '');

function card(dir, file, scale) {
  const id = stem(file);
  const isElite = id.startsWith('elite_');
  const name = NAMES[id.replace(/^elite_/, '')] ?? NAMES[id] ?? '';
  return `<div class="card"><img src="sprites/${dir}/${file}" style="width:${16 * scale}px;height:${16 * scale}px" loading="lazy"><div class="lbl">${isElite && name ? `👑 ${name}` : name || id}</div><div class="sub">${id}</div></div>`;
}

function section(title, dir, files, scale = 3, rawW = null) {
  if (!files.length) return '';
  const cards = files
    .map((f) => {
      if (rawW) {
        const id = stem(f);
        const name = NAMES[id.replace(/^elite_/, '')] ?? '';
        return `<div class="card" style="width:auto"><img src="sprites/${dir}/${f}" style="width:${rawW}px;image-rendering:pixelated" loading="lazy"><div class="lbl">${name || id}</div><div class="sub">${id}</div></div>`;
      }
      return card(dir, f, scale);
    })
    .join('');
  return `<h2>${title} <span class="cnt">${files.length}</span></h2><div class="grid">${cards}</div>`;
}

const monsters = pngs('monsters');
const elites = monsters.filter((f) => /^elite_/.test(f));
const baseMonsters = monsters.filter((f) => !/^elite_/.test(f));
const items = pngs('items');
const ui = pngs('ui');

const html = `<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>魔物酒馆 · 素材总览</title>
<style>
  body { background: #1a1410; color: #f0e6d2; font-family: "Segoe UI", "PingFang SC", sans-serif; margin: 0; padding: 20px; }
  h1 { color: #d9a441; font-size: 20px; }
  h2 { color: #f0d78c; font-size: 15px; border-bottom: 2px solid #5c4325; padding-bottom: 4px; margin-top: 28px; }
  .cnt { color: #a89880; font-size: 12px; font-weight: normal; }
  .grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .card { background: #1f1812; border: 2px solid #3a2d1e; padding: 6px; width: 76px; text-align: center; }
  .card img { image-rendering: pixelated; display: block; margin: 0 auto; }
  .lbl { font-size: 11px; margin-top: 4px; color: #f0e6d2; word-break: break-all; }
  .sub { font-size: 9px; color: #6b5d48; word-break: break-all; }
  .note { color: #a89880; font-size: 12px; }
  a { color: #d9a441; }
</style>
</head>
<body>
<h1>🍺 魔物酒馆 · 素材总览</h1>
<p class="note">全部素材按整数倍缩放展示（image-rendering: pixelated，与游戏内一致）。<a href="./">← 返回游戏</a></p>

${section('魔物（基础）', 'monsters', baseMonsters)}
${section('魔物（精英变体 · 金框+王冠）', 'monsters', elites)}
${section('职业', 'classes', pngs('classes'))}
${section('地板', 'tiles', pngs('tiles'), 2)}
${section('菜谱图标', 'items', items.filter((f) => f.startsWith('recipe_')))}
${section('材料图标（食材/建材/魔核/徽记）', 'items', items.filter((f) => f.startsWith('mat_')))}
${section('地图图标', 'items', items.filter((f) => /^map_\d/.test(f)))}
${section('成就图标', 'items', items.filter((f) => f.startsWith('ach_')))}
${section('种族徽章', 'items', items.filter((f) => f.startsWith('race_')))}
${section('UI 图标（货币/页签/设施/房间/家具元素）', 'ui', ui)}
${section('酒馆房间场景（32×32 原生）', 'furniture', pngs('furniture'), 2)}
${section('战斗背景墙带（AI 生成 + 调色板量化，256×32）', 'backdrops', rawPngs('backdrops'), 2, 512)}
${section('战斗装饰件（16×24 竖件 + 16×8 前景带）', 'dressing', rawPngs('dressing'))}
</body>
</html>`;

fs.writeFileSync(OUT, html);
console.log(
  `总览页已生成 → public/gallery.html（魔物 ${baseMonsters.length} + 精英 ${elites.length} + 图标 ${items.length + ui.length} + 场景 4，随构建部署）`,
);
