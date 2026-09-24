# 素材库（assets/packs）

第三方免费像素素材包，全部 **CC0 公有领域**（可商用、免署名）。风格基准：**Kenney Tiny 系**（16×16、2px 粗轮廓、圆润可爱）——与项目现有地牢贴图同源。

> 下载于 2026-09-23，来源均为 OpenGameArt（本机可直连）。详见各包内 License.txt。

## 已入库（6 包，约 1.2MB）

| 目录 | 素材包 | 内容 | 游戏内用途 |
|---|---|---|---|
| `clint-tiny-creatures/` | **Tiny Creatures**（Clint Bellanger，经 Kenney 授权，OGA） | 180 个 16×16 精灵：100+ 魔物 + 50+ 动物（史莱姆系/龙系/元素/鱼/野兽应有尽有） | **魔物贴图主力**：当前 53 种魔物仅 15 种有贴图，本包与 Tiny Dungeon 完全同风格，可大量补齐 |
| `kenney-tiny-town/` | **Tiny Town**（Kenney，OGA） | 132 tile：城镇/城堡/植被/道路 | 酒馆外景、未来世界地图扩展 |
| `kenney-roguelike-indoor/` | **Roguelike Indoor**（Kenney，OGA） | 480 精灵：厨房器具/桌椅沙发/床柜/装饰 | **酒馆视觉升级**：TavernMap 目前是 CSS 木纹，可用真家具贴图（注意：2015 系无 2px 粗轮廓，与 Tiny 系混用需先目检） |
| `shade-puny-dungeon/` | **Puny Dungeon**（Shade，OGA） | 地牢 tileset：2-Edge Wang 墙/动画水/火把/陷阱/交互物 + Tiled 样例 | 地牢地图视觉扩展；PROPOSAL 已注明"风格偏细，按需重着色" |
| `shade-puny-characters/` | **Puny Characters**（Shade，OGA） | 角色精灵表（战士/法师/弓手/工人 × 配色 + 兽人），含 idle/walk/攻击动画 | 冒险者皮肤/动画扩展备选（32×32 画布、实际占 16×16） |
| `oga-16x16-food/` | **16x16 Food**（OGA 用户，Hamletum 调色板） | 188 个独立食物图标（面包/奶酪/烤肉/蛋/饼/蛋糕…） | **菜谱图鉴、菜肴图标、酒窖饮品线**：即取即用的独立 16×16 PNG |

## 使用须知

- **Tilesheet 有 1px 间距**：所有 sheet 的网格步进是 17px（16+1）；**优先用各包 `Tiles/` 目录的独立 PNG**（tiny-creatures / tiny-town / food 均有独立文件），与 `public/sprites/` 现行工作流一致。
- **魔物默认朝右**（除对称形）：BattleViewport 现有镜像惯例（`scale.set(-3, 3)`）直接兼容，无需二次翻转。
- **风格混搭警告**：Tiny 系（粗轮廓）与 Roguelike 2015 系 / Puny 系（细线条）混用会撕裂，入库 ≠ 直接上屏，需逐张目检（参考 HANDOFF 的人脸坑教训）。
- Kenney 系 sheet 同时有 magenta / transparent 两版，用 transparent 版。

## 未入库但值得收藏（itch.io——本机当前不可达，代理未运行；开代理后手动下载）

| 素材包 | 地址 | 许可 | 说明 |
|---|---|---|---|
| Puny Dungeon 原版 | merchant-shade.itch.io/16x16-puny-dungeon | CC0 | 与已入库 OGA 版本同内容，itch 版更新更快 |
| **Fantasy Tavern mini** | glowcompany.itch.io/fantasy-tavern-mini | 免费 | 8 图标 + 2 地板 + 4 音效（酒杯/炖锅/面包/木桶）；付费全量 ~$5（32 图标 13 tile 22 音效）——PROPOSAL 指定的酒馆补充包 |
| Dungeon Pack | freegamesprites.itch.io/dungeon-pack | CC0 | 97 精灵：宝箱/药水/桶 |
| Anokolisa Topdown | anokolisa.itch.io | 免费 | 冒险者 4 向动画 + 50 武器（需重着色对齐 Kenney 调色板，冒险者贴图已部分采用） |
| Kenney 官网 Tiny 系列 | kenney.nl/assets/series:Tiny | CC0 | 官网系列页（tiny-dungeon 已在用）；官网直链可下载 |
| JokerCalico Food & Drink | jokercalico.itch.io | 部分免费 | 108 食物饮品图标，512×512 大图风格（非原生 16×16，需缩放） |

## 风格参考（非素材，不可入游戏）

- **迷宫饭魔物图鉴**（mzh.moegirl.org.cn/迷宫饭/魔物图鉴）：漫画/动画截图，**有版权**——仅作魔物设计、料理风味与图鉴排版的灵感参考，不可作为游戏素材使用。
- 迷宫饭"解剖学掉落/魔物料理"的设计方法论已体现在 `data/monsters.ts` 的解剖学掉落表与 16 道菜谱中。

## 复下载直链（OGA，全部 CC0）

```
https://opengameart.org/content/roguelike-indoor-pack      → Roguelike Indoor pack.zip
https://opengameart.org/content/tiny-town                   → kenney_tiny-town.zip
https://opengameart.org/content/tiny-creatures              → tiny-creatures.zip
https://opengameart.org/content/16x16-puny-dungeon-tileset  → puny_dungeon_v1.zip
https://opengameart.org/content/puny-characters             → puny-charactersorcs_included.zip
https://opengameart.org/content/16x16-food                  → food_0.zip
```
