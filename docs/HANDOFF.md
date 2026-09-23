# 开发交接文档（HANDOFF）

> 最后更新：2026-09-22 · 当前阶段：Phase 2 内容扩展
> **新会话恢复上下文：读本文件 + docs/PROPOSAL.md 即可继续**

## 当前状态

- 分支 `main`，工作区有未提交的 v4+v5 改动（25 改 + 8 新增），**尚未 commit**
- 测试 64/64，tsc + build 通过，Edge 冒烟通过（背景无脸 / 6 图 / BOSS 随机 / 图鉴实时计数）
- 存档版本 **v5**（6 地图制 + D&D 等级制）
- 游戏：**6 张主题地图**（无限循环刷怪 + 5% 随机 BOSS）/ 53 魔物 / 16 菜谱（迷宫饭式）/ 6 职业 × 9 DND 种族 / **冒险者等级 1-10（等级即稀有度，升级仪式制）** / 5 设施 / 战斗视口（事件流回放 + 按图主题背景）/ 图鉴·成就·统计页（17 成就）

## 本轮会话已完成（用户三大需求反馈 → v5 重构）

**① 背景人脸根治**：上轮 tile_098 仍是人脸——根因是 worklog 记的 1-based 编号 vs 官方 0-based 文件名**差一位**取错。本轮从 Kenney 官网下载 tiny-dungeon 官方拆分包（132 张独立 tile），放大 4 倍逐张目检建索引，6 张干净地板入库（`floor_mossy/mine/crypt/lava/crystal/void.png` = 官方 tile_0091/0076/0088/0084/0097/0068），删除旧的 floor/wall.png。

**② 20 层地牢 → 6 张主题地图**：
- `MAP_DEFS`（monsters.ts）：每图 monsterPool + bossPool + firstClearReputation + floorSprite/floorTint；53 种魔物全分布（原 1-4 层→图1、5-6→图2、7→图3、8-10→图4、11-15→图5、16-20→图6）
- 无限循环：`spawnWave(state, rng)` 随机组波（普通 2-4 只 / 5% BOSS 波=1 BOSS+1-2 护卫，rng 消耗顺序 isBoss→guards→bossPick）
- 首杀本图 BOSS → mapsFirstCleared + 声望 + 解锁下一图；菜谱解锁 floorClear→mapClear（区段映射）
- dungeon 状态：mapId/unlockedMaps/activeMap/waveCount（waveIndex/farmFloor/highestFloor 已删）
- BattleViewport：预载 6 张地板，按 activeMap 签名切换 texture+tint；DungeonPanel 6 图按钮（一~六中文标签 + 🔒 + ✓）

**③ D&D 等级制（等级即稀有度）**：
- 删 Rarity 5 档与 RARITY_MULT 乘区；等级 1-10，perLevel 曲线 ×3.5（Lv10 ≈ 原 Lv35 满级强度）
- **升级仪式**：经验攒满即停（不再自动升级），需花金币+材料手动升级（`store.levelUpAdventurer`，LEVEL_UP_COST 9 档，9→10 要 6500 金+6 虚空精华+5 魔核）
- 访客自带等级 1-10：权重 [30,24,17,11,7,4,2,0.9,0.35,0.12]×(1+rep×0.004×lv)——Lv10 万分之几；签约费 30×lv²、工资 2×lv²、材料分档
- 等级档 UI：levelTier() 学徒/老练/资深/大师/传奇 五档着色；训练场改为纯属性（不再抬等级上限）
- 存档 v4→v5 迁移：newLevel=clamp(max(rarityBase, ceil(oldLevel/3.5)), 1, 10)（rarityBase: common=1~legendary=5）、层→图区间映射、exp 清零

## 下一步（从这里继续）：Phase 2 剩余队列（按序）

酒窖饮品线 → 冒险者星级突破（吃同职业升星）→ 酒馆随机事件（拼酒/流浪商人）→ 移动端自适应打磨 → 转生系统评估

（注：v5 已把"升级仪式"做进 D&D 等级制，星级突破若做需与 10 级上限协调）

## 关键技术备忘

- **node PATH 前缀（每条命令必须）**：`$env:Path = "D:\1_Sotfware\Nodejs;C:\Users\chens\AppData\Roaming\npm;" + $env:Path`
- 命令：`pnpm dev`（5173）/ `pnpm build` / `pnpm test`
- 架构分层：`engine/`（纯函数模拟）→ `store/`（Zustand 唯一状态所有者）→ `ui/`；`data/` 全部类型化内容；战斗事件流 `state.events`（瞬态，serialize 剥离）
- 存档迁移链：`src/save/migrate.ts` 的 `migrations[n]`，当前 1→2→3→4→5
- **子代理仍不可用**（"Go models" 订阅错误，本轮已再次验证）——直接实现
- **Kenney tiny-dungeon 官方包直链**（CC0，132 张已拆分 tile_0000~0131.png）：`https://kenney.nl/media/pages/assets/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip`；**官方文件名 0-based**，旧 worklog 的索引是 1-based，相差一位
- 已目检干净地板：91/97/98/62/68/69/70/71/76/78/84/85/88/89；干净墙：40/47/55/104/107/108/109/111/115/116/120/123/125/126/128/130；**99-103 是圆盘雕刻（人脸坑区）**
- 冒烟测试方案：临时目录 `npm i playwright-core` + Edge `channel:'msedge'` headless（playwright MCP 的 chrome channel 不可用）
- TS 小坑：`Partial<Record<K, number>>` 的 reduce 需 `reduce<number>((s,n)=>s+(n??0),0)`
- spawnWave 测试注入：`fakeRng([0.01, 0.99, 0, 0.5])` = 强制 BOSS+2 护卫+slime_king；普通波测试需钳首值 ≥0.05 防 5% 撞车
- 图鉴数值：魔物 **53** 种；rosterCap 上限 9（万国来朝需招待区满级 + 9 人全种族）
- 用户反馈通道：试玩 → 反馈 → 修复+队列推进；用户偏好迷宫饭/DND 风味；本轮新增偏好：升级要有仪式感与代价（D&D 高等级世界屈指可数）
