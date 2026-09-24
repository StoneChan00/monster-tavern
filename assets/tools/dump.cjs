/* 文本像素画：透明 '.' / 暗轮廓 '#' / 暗色 'x' / 红 R 绿 G 蓝 B 黄 Y / 中性 o */
const fs = require('fs');
const { PNG } = require('pngjs');

function dump(file) {
  const png = PNG.sync.read(fs.readFileSync(file));
  const { width, height, data } = png;
  let trans = 0;
  console.log(`=== ${file.split(/[\\/]/).pop()} (${width}x${height}) ===`);
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a < 32) { row += '.'; trans++; continue; }
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
  console.log(`transparent: ${Math.round((trans / (width * height)) * 100)}%`);
  console.log('');
}

process.argv.slice(2).forEach(dump);
