/* 线上站点运行时验证（白屏事故 2026-09-30 教训：HTTP 200 ≠ 页面存活，推送前需真实浏览器验证）
 * 证据四件套：pageerror（未捕获异常）/ console error / canvas 挂载（Pixi 存活）/ 像素图标加载
 *
 * 用法：
 *   npm i playwright-core            # 一次性安装（任意目录）
 *   node check-live.cjs [url]        # 默认线上地址
 *   PLAYWRIGHT_SHELL=<可执行文件> 可覆盖浏览器路径
 *
 * 浏览器来源：playwright 官方 headless shell（chromium_headless_shell-1243），
 * 默认路径为本机缓存位置，其他机器用 PLAYWRIGHT_SHELL 指定。
 */
const { chromium } = require('playwright-core');

const EXE =
  process.env.PLAYWRIGHT_SHELL ??
  `${process.env.HOME ?? ''}/.cache/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-linux-arm64/chrome-headless-shell`.replace(
    /^\/\//,
    '/',
  );
const URL = process.argv[2] || 'https://stonechan00.github.io/monster-tavern/';

(async () => {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e.message).slice(0, 200)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text().slice(0, 200));
  });

  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });

  // 画布轮询：贴图预载（约 200 个小文件）在冷缓存下可能耗时 10s+
  let canvasAt = null;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(1000);
    const n = await page.evaluate(() => document.querySelectorAll('canvas').length);
    if (n > 0) {
      canvasAt = i + 1;
      break;
    }
  }

  const result = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() ?? null,
    canvasSize: (() => {
      const c = document.querySelector('canvas');
      return c ? `${c.width}x${c.height}` : null;
    })(),
    tabButtons: document.querySelectorAll('nav button').length,
    iconImgs: document.querySelectorAll('img.pixel-img').length,
    brokenImgs: [...document.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length,
  }));

  const fail = errors.length > 0 || !result.canvasSize || result.brokenImgs > 0;
  console.log(
    JSON.stringify({ url: URL, canvasAppearedAfterSec: canvasAt, result, errorCount: errors.length, errors: errors.slice(0, 5), verdict: fail ? 'FAIL' : 'PASS' }, null, 2),
  );
  await browser.close();
  process.exit(fail ? 2 : 0);
})().catch((e) => {
  console.error('SCRIPT FAIL:', e.message);
  process.exit(1);
});
