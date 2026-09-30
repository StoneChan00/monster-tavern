# 魔物酒馆 · 美术风格规范 STYLE.md

> 本文档是全部视觉产出的单一真值源。新增/修改任何素材前先读本文；产出后按 §5 管线自检。
> 设计 token 的代码真值源：`src/index.css` 的 `@theme` 块。

## 1. 核心风格

**Kenney Tiny 系**（圆润可爱的粗轮廓像素风），灵感：迷宫饭 / D&D。

| 规则 | 值 | 违例后果 |
|---|---|---|
| 网格 | 一切游戏素材 **16×16** | 混合网格导致缩放对不齐 |
| 轮廓 | **2px 粗轮廓**，圆角拐角（外轮廓 2px，内部细节可 1px） | 细线条素材（Roguelike 2015 系 / Puny 系）直接上屏会风格撕裂 |
| 调色板 | 全局共享 ≤48 色（§2） | 每张图自配色 → 画面花 |
| 缩放 | 仅整数倍 + `image-rendering: pixelated` | 非整数缩放/抗锯齿 = 糊 |
| 朝向 | 生物默认**朝右**（BattleViewport 有镜像惯例） | 朝向混乱 |
| UI 语言 | 硬边框 2px + 硬阴影偏移、**全直角**（禁 border-radius）、无渐变模糊 | 圆角/软阴影破坏像素感 |
| 字体 | Fusion Pixel 12px（OFL-1.1），12px 及整数倍下最锐利 | 系统字体与像素素材质感割裂 |

## 2. 调色板（Design Tokens）

代码真值源 `src/index.css @theme`，Tailwind 工具类与 CSS 变量双注册（如 `bg-wood-800` = `var(--color-wood-800)`）。

### 木质背景梯度（深→浅）
| Token | Hex | 用途 |
|---|---|---|
| `wood-950` | `#141009` | 战斗画布底 |
| `wood-900` | `#171008` | 锁定/禁用底 |
| `wood-850` | `#1a1410` | 页面底 |
| `wood-800` | `#1f1812` | 卡片底 |
| `wood-750` | `#241b13` | 面板渐变下端 |
| `wood-700` | `#2b2118` | 面板渐变上端 |
| `wood-600` | `#332818` | 悬停底 |
| `wood-500` | `#3a2d1e` | 按钮底 / 卡片描边 |
| `wood-400` | `#4a3a26` | 按钮悬停底 |

### 树皮描边 / 羊皮纸文字 / 点缀色
| Token | Hex | 用途 |
|---|---|---|
| `bark-600` | `#5c4325` | 面板描边 |
| `bark-500` | `#8a6a2a` | 可点击房间描边 |
| `parchment` | `#f0e6d2` | 主文字 |
| `parchment-dim` | `#a89880` | 次级文字 |
| `parchment-faint` | `#8a7a62` | 三级文字 |
| `parchment-mute` | `#6b5d48` | 极淡文字 |
| `gold` | `#d9a441` | 主按钮/激活/焦点 |
| `gold-bright` | `#e8b455` | 金色悬停 |
| `gold-text` | `#f0d78c` | 金色文字 |
| `ember` | `#7a2d22` | 危险按钮底 |
| `ember-deep` | `#5c1f16` | 危险描边 |
| `ember-bright` | `#8f372a` | 危险悬停 |
| `ember-text` | `#f0d5cf` | 危险文字 |

### 状态色（组件内联使用，暂未 token 化）
HP 绿 `#7cb342` · 饱食绿 `#a5d47a` · 魔物 HP 红 `#c0392b` · 经验紫 `#7e57c2` · 经验满金 `#ffd24a` · 忠诚红 `#e5533d` · 精英描边 `#8a3a2a`（底 `#2a1512`）

### 素材共用色（像素画生成器 `assets/tools/gen-icons.cjs` 的 PAL 表）
轮廓统一 `#3a2d1e`（= wood-500）；魔物贴图沿用 Tiny Creatures 原始配色；自绘图标仅允许使用生成器 PAL 表中登记的颜色，新增颜色须先入表。

## 3. 素材目录与归属

| 目录 | 内容 | 来源/许可 |
|---|---|---|
| `public/sprites/monsters/` | 魔物 59 + 精英变体 36 | Tiny Creatures（CC0）+ 程序化变体（原创，gen-elites.cjs） |
| `public/sprites/classes/` | 职业 6 | Tiny Creatures（CC0） |
| `public/sprites/tiles/` | 地板 13 | Kenney Tiny Dungeon（CC0） |
| `public/sprites/items/` | 菜谱 24 / 材料 29 / 地图 6 / 成就 17 / 种族徽章 9 | oga-16x16-food（CC0，描边加深再加工）+ 程序化自绘（原创） |
| `public/sprites/ui/` | 货币/页签/设施/房间图标/家具元素 | 程序化自绘（原创） |
| `public/sprites/furniture/` | 酒馆房间场景 32×32 ×4 | 程序化合成（原创，gen-furniture.cjs） |
| `public/sprites/dressing/` | 战斗景深装饰：16×24 竖件 ×11 + 16×8 前景带 ×6 | 程序化自绘（原创，gen-dressing.cjs） |
| `public/sprites/backdrops/` | 战斗背景墙带 256×32 ×6 | Qwen-Image 生成 + 调色板量化（gen-backdrops.cjs） |
| `src/assets/fonts/` | Fusion Pixel 12px（latin + zh_hans） | OFL-1.1，见同目录 LICENSE |

原始素材包（勿直接引用）：`assets/packs/`。归属惯例：每个 `public/sprites/*` 目录带 `LICENSE.txt`。

## 4. 图标体系

- **数据接入**：数据定义（`MaterialDef` / `RecipeDef` / `AchievementDef` / `MapDef` / `FacilityDef` / `RaceDef`）的 `icon` 字段保留 emoji 作回退；新增 `sprite?: string` 字段指向 `public/sprites/items|ui/` 下的文件名。
- **渲染**：`src/ui/GameIcon.tsx`（贴图优先，emoji 回退），与 `MonsterSprite` / `CharacterSprite` 同范式。
- **守护**：`tests/engine.test.ts`「图标贴图完整性」——所有 sprite 映射必须指向真实文件。

## 5. 产出管线（新素材必走）

1. **来源四选一**：CC0 素材包切片（`export3.cjs`）→ 程序化自绘（`gen-icons.cjs` / `gen-dressing.cjs` / `gen-furniture.cjs` / `gen-elites.cjs`）→ AI 背景板（Qwen-Image 生成 + `gen-backdrops.cjs` 量化，仅限 §6 修订案范围）
2. **输出** 16×16 PNG 至 `public/sprites/<类目>/`，文件名小写下划线语义命名
3. **映射** 写入对应 `src/data/` 模块（类型强制，漏配编译报错）
4. **目检**：`node assets/tools/dump.cjs <文件>` ASCII 渲染逐张检查（透明 `.` 暗轮廓 `#` 暗色 `x` 红R 绿G 蓝B 黄Y 中性o）
5. **测试**：`pnpm test`（贴图完整性）+ `pnpm build`
6. **AI 生成图政策**（PROPOSAL §4.4 修订案，项目所有者 2026-09-30 批准）：
   - **允许**：战斗背景墙带（backdrops/）——Qwen-Image（Apache-2.0，本地 NPU）生成，**必须**经 gen-backdrops.cjs 量化到本调色板后使用
   - **仍然禁止**：精灵/图标/道具类素材直接使用 AI 图（网格精度与轮廓语言不兼容）；AI 图不得绕过量化工序上屏

## 6. 已知风格风险

- **细线条包**（Roguelike Indoor / Puny 系）：入库 ≠ 上屏，须重着色 + 补 2px 描边后逐张目检
- **借形魔物**：sprites.ts 注释标注了复用/借形条目，语义漂移的逐步替换中
- 系统字体在 Fusion Pixel 未加载完成时短暂可见（font-display: swap），属预期行为
