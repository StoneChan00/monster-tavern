# 开发交接文档（HANDOFF）

> 最后更新：2026-09-23 · 当前阶段：Phase 2 内容扩展
> **新会话恢复上下文：读本文件 + docs/PROPOSAL.md 即可继续**

## 当前状态

- 分支 `main`，v7 改动**待 commit**（本轮五系统联动：视口修复+站位 / 精英怪体系 / 厨房菜单制 / 升级材料链 / 内容扩容）
- 测试 78/78，tsc + build 通过，Edge 冒烟全绿（主 26/26 + 移动 4/4 + 像素 5/5 + 复活定向 3/3）
- 存档版本 **v7**（精英体系 + 厨房菜单制；v6 档自动迁移：job/buffs → 7 槽空菜单）
- 页签：地牢（地图+编队+战斗）/ 宿舍（名册）/ 厨房（**菜单制**）/ 酒馆（地图+招待区+设施+背包）/ 图鉴

## 本轮会话已完成（用户五点反馈 → v7 大改）

**① 休整后战斗画面卡住（已根治）**：根因 = 复活事件与新波次**同帧**处理时，新 banner 销毁旧 banner 但旧 banner 的 1000ms 补间仍在跑 → 对已销毁 Text 调 `t.scale.set()` → **Pixi ticker 每帧抛错 → 视口永久冻结**。修复 = showBanner/hit 补间/layoutParty 全部加 `destroyed` 守卫；另修复活后队伍永远 0.35 透明度（layoutParty 只暗化不恢复）。定向冒烟 `smoke-revive.cjs`（休整期鲜艳红=0 → 复活后=342 → 无 pageerror）

**② 前后排站位视觉**：BattleViewport `rowXOffset(slot)`——前排 X+22 贴近魔物、后排 X-22 靠后，队伍纵深一目了然

**③ 精英怪体系（替代 BOSS 概念）**：
- 每图 `elitePool: EliteDef[]` **6 只职业向精英**（借用魔物体型 ×2.2hp/×1.35atk，名字全定制如「虚空弥撒」「万籁俱寂」）；5% 精英波 = 1 精英 + 1-2 护卫，**rng 消耗顺序：isElite→elitePick→guards→guardPick**
- 精英击杀必掉：**职业徽记 ×1**（6 新材料 mat_sigil_*）+ **本图魔核 ×1**（6 新材料 mat_elite_core_1..6，图名主题化：苔藓古树心/秘银星髓/骸骨圣灰/熔火之核/晶簇之心/虚空结晶）
- 首次讨伐本图精英 → 声望 + 解锁下一图（`mapsFirstCleared` 语义改为精英；`totalBossKills` 字段名保留=精英击杀数）
- **升级仪式费用 `levelUpCost(目标等级, 职业id)`**：升到 2/3 级用普通掉落（凝胶/甲壳）；升到 3-8 级 = 图 1-6 精英材料（徽记 1/1/2/2/3 + 魔核 3/4/5/6/7）；**9、10 级暂未开放**（`UPGRADE_CAP=8`，只能靠稀有访客）；图 6 的虚空结晶可囤积为 9-10 级预留
- 普通怪掉落回归纯烹饪用途

**④ 厨房菜单制（v7 核心）**：
- `KitchenState = { menu: 7 槽, menuFed: 每槽供给态, nextMenuCycleAt, unlockedRecipes }`；**每小时消耗菜谱材料**维持供给（`runMenuCycle`：逐槽扣料，缺料槽暂停；供给成功全员 +3 忠诚、出餐计数）
- **菜品效果独立生效（无结构门控）**；**结构 = 额外加成且嵌套叠加**：满足某级类别要求 → 该级加成生效，高级结构 ⊇ 低级（类别累进）→ 满足 4 级满席自动触发 1-4 级全部。1级「温饱套餐」供给忠诚+2；2级「丰盛套餐」全属性+5%；3级「盛宴」经验+8%；4级「满汉全席」掉落+10%（`activeMenuStructures` / `menuLoyaltyBonus`；乘区在 stats.ts）
- `store.setMenuSlot`：上菜即尝试一次供给（足料立即生效）；`cook` 动作删除
- 厨房升级：金币 + **精英魔核** + **菜谱解锁数门槛**（4/7/10/14 道）

**④b 材料背包信息化**：`data/materialInfo.ts` 全派生（不落档）——`upgradeUsagesOf`（扫 levelUpCost 反查"职业→Lv.X-X"）、`isFoodMaterial`（菜谱原料判定）、`materialSourcesOf`（普通怪掉落表 + 精英固定掉落反查"图N·地图名 来源"）、`isEliteDrop`（徽记/魔核）。InventoryBar：精英材料**绿色卡片**、菜单消耗 **-X/h** 徽标（按当前供料菜汇总）、悬停 title 显示描述+食材/升级标注+来源

**⑤ 内容扩容**：
- 魔物 53→**59** 种（每图 +1：淤泥怪/矿道妖精/缠绷带的不朽者/地狱犬/雪原巨怪/虚空小鬼，贴图同步导出）+ 36 只精英（数据驱动，计入借用魔物图鉴）
- 菜谱 16→**24** 道：全部标注 7 大类别（前菜/汤/副菜/主菜/沙拉/甜点/饮品），新增 8 道补齐早期结构可行性（凝胶汽水=初始饮品等）

## 下一步（从这里继续）：Phase 2 剩余队列（按序）

酒窖饮品线（可并入菜单饮品位）→ 冒险者星级突破 → 酒馆随机事件（拼酒/流浪商人）→ 移动端自适应打磨 → 转生系统评估

（9、10 级升级仪式与图 6 虚空结晶的消耗端是预留接线点）

## 关键技术备忘

- **精灵切片管线（本轮重建，工具在 `assets/tools/`）**：tiny-creatures 的 `Tiles/` 个体文件被量化污染（黑/紫/棕混合底，**不可直接用**）；正确源是官方 packed tilemap（17×17 格，1-based 编号与 Tilesheet.txt 顺序一致）。**棕底格**（行 0-8，#1-90）抠棕即得（紫描边完好）；**紫底格**（行 9-17，#91-180）洪泛抠紫 + 原位还原描边内层（被抠紫像素邻接存活即恢复）+ 1px 四邻域外扩描边外层 + 回填封闭孔洞（保眼睛等细节）。`dump.cjs` 文本像素画（多模态挂时的目检替代）、`census.cjs` 全包普查、`export3.cjs` 导出器
- **贴图现状**：53 魔物 + 6 职业 **全覆盖**（`MONSTER_SPRITES` 键类型取自 `MONSTERS`，漏配编译报错；文件存在性由测试守护）；职业=红骑士/女巫/天使/猫人/半人马/萨提尔；同图内不重复借形，跨图复用靠 tint 区分（映射注释在 sprites.ts）。旧职业贴图全是错拷的门/箱子/墙块（tile 0-6 按序命名），旧 6 张"地板"是带透明缺角的物件块——均已替换删除
- **地板混铺**：每图 2 基底 + 1 点缀（`MAP_DEFS.floorSprites`），BattleViewport 按位置哈希选变体（60%/28%/12%），稳定不闪烁；13 张全铺纹理来自 Kenney Tiny Dungeon 官方 Tiles（36/37/39 石纹系、42/43/48/49 沙岩系、52/75 棕砖系、63/70/91 花纹点缀、30 格栅）
- **像素级冒烟**：`pw-smoke/smoke-sprites.cjs`——截图战斗视口 → 直方图验证地板 ≥3 显著色调（旧单一贴图仅 1-2）+ 队伍侧红甲/魔物侧彩色像素存在性
- **素材已入库**：`assets/packs/` 7 个 CC0 包（见 `assets/README.md`）——Tiny Creatures 180 魔物、**Tiny Dungeon 官方 132 tiles（本轮地板/切片源）**、Roguelike Indoor 480 家具、16x16 Food 188 食物图标（菜谱/酒窖线）、Puny Dungeon/Characters、Tiny Town。itch.io 本机不可达时走 OGA 直链（README 有复下载直链）
- **node PATH 前缀（每条命令必须）**：`$env:Path = "D:\1_Sotfware\Nodejs;C:\Users\chens\AppData\Roaming\npm;" + $env:Path`
- 命令：`pnpm dev`（5173）/ `pnpm build` / `pnpm test`
- 架构分层：`engine/`（纯函数模拟）→ `store/`（Zustand 唯一状态所有者）→ `ui/`；`data/` 全部类型化内容；战斗事件流 `state.events`（瞬态，serialize 剥离）
- 存档迁移链：`src/save/migrate.ts` 的 `migrations[n]`，当前 1→2→3→4→5→6
- **子代理仍不可用**（"Go models" 订阅错误，上轮已验证）——直接实现
- **Kenney tiny-dungeon 官方包直链**（CC0，132 张已拆分 tile_0000~0131.png）：`https://kenney.nl/media/pages/assets/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip`；**官方文件名 0-based**，旧 worklog 的索引是 1-based，相差一位
- 已目检干净地板：91/97/98/62/68/69/70/71/76/78/84/85/88/89；干净墙：40/47/55/104/107/108/109/111/115/116/120/123/125/126/128/130；**99-103 是圆盘雕刻（人脸坑区）**
- 冒烟测试：`C:\Users\chens\AppData\Local\Temp\opencode\pw-smoke\`（playwright-core 已装；`smoke.cjs` 桌面版含种子档注入 + `smoke-mobile.cjs` 375px 版）。跑法：`vite preview --port 4173` 后台起 → `node smoke.cjs`。**注意 bash 工具的 workdir 必须先存在**（先在父目录 mkdir）
- TS 小坑：`Partial<Record<K, number>>` 的 reduce 需 `reduce<number>((s,n)=>s+(n??0),0)`
- spawnWave 测试注入：`fakeRng([0.01, 0.99, 0, 0.5])` = 强制 BOSS+2 护卫+slime_king；普通波测试需钳首值 ≥0.05 防 5% 撞车
- 确定性团灭测试法：`s.roster[0].hp = 0; s.dungeon.status = 'combat'` → resolveRound 直接 onWiped，无战斗收入可精确断言金币
- 冒烟 strict 模式坑：`getByText('X')` 会同时命中日志行与弹窗标题 → 用 `locator('h2:has-text(...)')` 或 `div.fixed .pixel-panel` 限定
- 图鉴数值：魔物 **53** 种；rosterCap 上限 9（万国来朝需招待区满级 + 9 人全种族）
- 用户反馈通道：试玩 → 反馈 → 修复+队列推进；用户偏好迷宫饭/DND 风味；偏好：升级要有仪式感与代价；新偏好：引导/资助类机制要"文案自适应进度"（老玩家不该看到新手话术）
