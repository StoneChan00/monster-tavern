/* tile 普查：透明率 + 主色 + 8x8 降采样形状签名 */
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
for (const f of files) {
  const p = PNG.sync.read(fs.readFileSync(path.join(dir, f)));
  const { width, height, data } = p;
  let trans = 0;
  const colorCount = {};
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 32) { row.push('.'); trans++; continue; }
      const lum = 0.3 * r + 0.6 * g + 0.1 * b;
      const ch = lum < 55 ? '#' : lum < 115 ? 'x' : 'o';
      row.push(ch);
      const key = `${r},${g},${b}`;
      colorCount[key] = (colorCount[key] || 0) + 1;
    }
    grid.push(row);
  }
  // 8x8 降采样（2x2 块 → 出现最多的字符）
  let sig = '';
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      const votes = {};
      for (let y = by * 2; y < by * 2 + 2; y++)
        for (let x = bx * 2; x < bx * 2 + 2; x++) {
          const c = grid[y][x];
          votes[c] = (votes[c] || 0) + 1;
        }
      sig += Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    }
    if (by < 7) sig += '';
  }
  const top = Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 2)
    .map(([c, n]) => c).join(' | ');
  const idx = f.replace(/\D/g, '');
  console.log(`${idx.padStart(3)} 透${String(Math.round((trans / (width * height)) * 100)).padStart(3)}%  [${sig}]  ${top}`);
}
