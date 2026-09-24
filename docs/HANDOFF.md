# 开发交接文档（HANDOFF）

> 最后更新：2026-09-23 · 当前阶段：Phase 2 内容扩展
> **新会话恢复上下文：读本文件 + docs/PROPOSAL.md 即可继续**

## 当前状态

- 分支 `main`，改动**待 commit**（本轮三连：v6 资助+地图 → 下架训练场/情报网 → **页签重组**）
- 测试 71/71，tsc + build 通过，Edge 冒烟通过（桌面 22/22 + 移动端 375px 4/4）
- 存档版本 **v6**（v5 + `meta.wipeSubsidyClaimed`）
- **页签结构（本轮重组）**：地牢（地图+**编队**+战斗视口）/ **宿舍**（名册：队伍中·含排位/休息中）/ 厨房 / 酒馆（地图+**招待区·到访冒险者**+设施+背包）/ 图鉴
- 游戏：6 张主题地图 / 53 魔物 / 16 菜谱 / 6 职业 × 9 DND 种族 / 冒险者等级 1-10（升级仪式制）/ **在营设施 3 个**（招待区/厨房/宿舍）/ 首次团灭应急资助引导 / 酒馆地图 / 图鉴·成就·统计页（17 成就）

## 本轮会话已完成

**① v6 首次团灭应急资助**：`onWiped` 首次发放 200 金 + 魔物甲壳×4（`meta.wipeSubsidyClaimed` 一次性标记）；无客时到访提前至 60s 内；store 三路径（tick/catchUp/initStore）快照对比捕捉跃迁 → 引导弹窗；文案按 roster 自适应。**引导跳转目标已随页签重组改为酒馆页签（招待区面板 + guide-flash 4s 脉冲）**。

**② 酒馆地图（TavernMap.tsx）**：平面图 3 列布局（宿舍|前台+招待区|厨房），移动端单列堆叠；房间实时状态。**可点击房间**：招待区→滚动定位 `#lounge-visitors`（复用 recruitHighlight 高亮）、厨房→厨房页签、宿舍→**宿舍页签**；前台为展示区。

**③ 下架训练场/情报网**：`FACILITIES` 改 `Partial<Record>` 只留 lounge/kitchen/dorm；`FacilityId` 与 `state.tavern` 字段保留（旧档 trainingGround 加成在 stats.ts 继续生效，仅不可再升级）；情报网本就无逻辑消费，纯移除。无需迁移。

**④ 页签重组（冒险者栏拆解）**：
- 编队（前中后排 SlotCard）→ **DungeonPanel**（地图与战斗面板之间），空编队提示改为指向上方编队
- 招募（RecruitPanel）→ **酒馆页签**（TavernMap 下方），改题「招待区 · N 位冒险者正在用餐」，`Panel` 组件新增 `id` 属性支持锚点
- 冒险者页签 → **宿舍页签**（TabId `party`→`dorm`，PartyPanel 删除）：宿舍名册 = 全 roster 的 AdventurerCard 网格，状态行 `⚔️ 队伍中（前排/中排/后排）`/`🛏️ 休息中`，按槽位序排列，头部计数
- 清理：facilityHighlight 基础设施整体移除（store 字段/action/timer、FacilityCard 锚点高亮）；FirstWipeGuideModal 文案改指「酒馆招待区」

## 下一步（从这里继续）：Phase 2 剩余队列（按序）

酒窖饮品线 → 冒险者星级突破（吃同职业升星）→ 酒馆随机事件（拼酒/流浪商人）→ 移动端自适应打磨 → 转生系统评估

（注：升级仪式已并入 D&D 等级制，星级突破若做需与 10 级上限协调；前台房间暂无跳转，可扩展为存档/账台管理入口）

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
