简体中文 | [English](README.en.md)

# 魔物酒馆 Monster Tavern 🍺⚔️

> 经营一家开在地牢入口的酒馆：招募冒险者、组队下地牢刷怪，用魔物掉落做菜供应菜单——迷宫饭式挂机经营 RPG。

**🎮 在线游玩：https://stonechan00.github.io/monster-tavern/**

## 玩法

- ⚔️ **六张主题地图**：苔藓洞窟 → 虚空终焉，无限波次循环；每波 5% 概率遭遇**精英怪**，每张图的精英覆盖全部 6 个职业——击杀即掉落本职业徽记 + 本图魔核，是升级仪式的唯一来源
- 🧑‍🤝‍🧑 **D&D 等级制冒险者**：6 职业 × 9 种族，Lv1-10；经验攒满后需在酒馆举行**升级仪式**（职业徽记 + 对应地图的精英魔核）
- 📈 **晋升梯度跟着地图走**：Lv2-4 在图1、Lv5 图2、Lv6 图3、Lv7 图4、Lv8 图5、Lv9-10 图6；精英徽记的掉落量也随地图加深递增（1→2→3），越深的地牢收益越高
- 🍳 **厨房菜单制**：设置菜单后每小时消耗食材维持菜品效果；凑齐「前菜+主菜+饮品」等结构获得套装加成（可叠加）
- 🍻 **美食即招募**：解锁菜谱提升对应职业冒险者的到访权重
- 💀 **失败友好**：首次团灭有应急资助引导；离线收益照常结算（8 小时上限）
- 📖 **图鉴 · 成就 · 统计**：76 种魔物、24 道菜谱、17 个成就
- 📱 **纯挂机**：关掉页面照样结算，回来弹出离线收益日报

## 云存档（可选）

不登录也能完整游玩，存档默认保存在浏览器本地（localStorage）。

登录 Google / GitHub 账号后，存档会同步一份到云端，换设备登录同一账号即可接着玩：

- 本地存档永远是主副本，云端只是副本；网络异常不影响游玩
- 本机与云端都有新进度时**弹出冲突弹窗**由玩家选择，绝不静默覆盖
- 基于 Firebase Authentication + Realtime Database，存档按账号 uid 隔离

部署步骤与安全规则见 [docs/cloud-save.md](docs/cloud-save.md)。未配置 Firebase 时游戏自动退化为纯本地版本。

## 技术栈

React 19 · TypeScript · Vite 8 · Tailwind CSS v4 · PixiJS v8 · Zustand · Firebase（可选）

引擎与 UI 完全解耦：`src/engine` 是纯函数式模拟层，可在 Node 里离线复算，因此测试不依赖浏览器。

## 本地开发

需要 Node 20+ 与 pnpm 10：

```bash
pnpm install
pnpm dev      # http://localhost:5173/monster-tavern/
pnpm test     # 114 个用例：引擎 / 材料反查 / 地图景深 / 云同步决策与版本守卫
pnpm build    # 产物输出到 dist/
pnpm preview  # 预览构建产物
```

云存档需自备 Firebase 项目，把 5 个公开配置值写进 `.env.local`（模板见 [.env.example](.env.example)）。不配置也能正常开发和游玩。

## 项目结构

```
src/
├── engine/    # 模拟层：战斗、掉落、离线结算、数值与类型（纯函数，可 Node 复算）
├── data/      # 内容数据：魔物、职业、种族、菜谱、材料、设施、成就
├── save/      # 存档：序列化 / 版本迁移链 / 持久层适配器 / 存档事件总线
├── cloud/     # 云同步：Firebase 初始化、RTDB 读写、同步决策（纯函数）
├── store/     # Zustand：游戏状态机与云同步状态机
├── ui/        # 界面：地牢、宿舍、厨房、酒馆场景、图鉴、背包
├── app/       # 游戏心跳（rAF 驱动，处理切页签与离线补算）
├── utils/     # 格式化等小工具
└── assets/    # 字体等静态资源
tests/         # vitest 用例
assets/tools/  # 素材生成脚本（pngjs 程序化生成精灵与场景图）
docs/          # 设计文档、风格规范、云存档接入指南
```

存档格式自带 `version` 字段与 v1→v7 的迁移链，旧档永不报废。

## 部署

推送到 `main` 会触发 `.github/workflows/deploy-pages.yml`，构建后发布到 GitHub Pages。

云存档配置来自仓库内的 `.env.production`（公开值，真正的访问控制在数据库规则里）。注意：**不要在 workflow 里注入空的 secrets**，空字符串会覆盖 `.env.production`，导致云同步被关闭——详见 [docs/cloud-save.md](docs/cloud-save.md)。

## 相关文档

- [docs/cloud-save.md](docs/cloud-save.md) — 云存档接入、RTDB 安全规则、行为规格
- [docs/STYLE.md](docs/STYLE.md) — 像素美术风格规范与产出管线
- [docs/PROPOSAL.md](docs/PROPOSAL.md) — 设计提案
- [docs/HANDOFF.md](docs/HANDOFF.md) — 交接说明

## 素材致谢

- [Kenney](https://kenney.nl)（Tiny Dungeon / Tiny Town / Roguelike Indoor 等，CC0）
- [Tiny Creatures by Clint Bellanger](https://opengameart.org/content/tiny-creatures)（CC0，经 Kenney 授权）
- [16x16 Food](https://opengameart.org/content/16x16-food)（Hamletum 调色板，CC0）
- [Fusion Pixel Font](https://github.com/TakWolf/fusion-pixel-font)（OFL-1.1）
- 灵感：迷宫饭 / D&D

## 许可

[MIT](LICENSE)
