# 魔物酒馆 Monster Tavern 🍺⚔️

> 经营一家开在地牢入口的酒馆：招募冒险者、组队下地牢刷怪，用魔物掉落做菜供应菜单——迷宫饭式挂机经营 RPG。

**🎮 在线游玩：https://stonechan00.github.io/monster-tavern/**

## 玩法

- ⚔️ **六张主题地图**：苔藓洞窟 → 虚空终焉，无限波次循环；每波 5% 概率遭遇**精英怪**（每图 6 种职业向精英），掉落职业徽记与魔核
- 🧑‍🤝‍🧑 **D&D 等级制冒险者**：6 职业 × 9 种族，Lv1-10；经验攒满后需在酒馆举行**升级仪式**（职业徽记 + 对应地图的精英魔核）
- 🍳 **厨房菜单制**：设置菜单后每小时消耗食材维持菜品效果；凑齐「前菜+主菜+饮品」等结构获得套装加成（可叠加）
- 🍻 **美食即招募**：解锁菜谱提升对应职业冒险者的到访权重
- 💀 **失败友好**：首次团灭有应急资助引导；离线收益照常结算（8 小时上限）
- 📖 图鉴 · 成就 · 统计：59 种魔物、24 道菜谱、17 个成就

进度自动保存在浏览器本地，图鉴页可导出/导入存档。

## 本地开发

```bash
pnpm install
pnpm dev      # http://localhost:5173/monster-tavern/
pnpm test     # 引擎与数据完整性测试
pnpm build    # 产物输出到 dist/
```

技术栈：React 19 · TypeScript · Vite · Tailwind CSS v4 · PixiJS v8 · Zustand（引擎与 UI 完全解耦，模拟层可离线复算）。

## 素材致谢

- [Kenney](https://kenney.nl)（Tiny Dungeon 等，CC0）
- [Tiny Creatures by Clint Bellanger](https://opengameart.org/content/tiny-creatures)（CC0，经 Kenney 授权）
- 灵感：迷宫饭 / D&D
