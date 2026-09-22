# 开发交接文档（HANDOFF）

> 最后更新：2026-09-22 · 当前阶段：Phase 2 内容扩展
> **新会话恢复上下文：读本文件 + docs/PROPOSAL.md 即可继续**

## 当前状态

- 分支 `main`，工作区干净，全部已推送
- 测试 48/48，构建通过（~570KB / gzip 174KB，含 PixiJS）
- 存档版本 **v3**（v4 计划中，见下）
- 游戏：20 层地牢 / 52 魔物 / 16 菜谱（迷宫饭式）/ 6 职业 × 9 DND 种族 / 5 设施 / 战斗视口（事件流回放）

## 本轮会话已完成

1. **背景修复**：原 floor/wall tile 误选了 Kenney 图集的「雕刻人脸」变体（用户反馈"满屏人头像"）→ 换成干净石地板 `tile_098`（wall 备用 `tile_074`），并简化背景为「地板平铺 + 压暗层 0.4」（移除墙带层）
2. **编队槽位显示稀有度**：成员名与标签按稀有度着色（PartyPanel SlotContent）
3. **替补席解雇**：`store.dismissAdventurer(id)`（编队成员自动下场）+ 冒险者卡「解雇」按钮（confirm 确认）

## 下一步（进行中，从这里继续）：v4 + 图鉴/成就/统计页

用户四项需求中前三项已完成；第四项「继续 Phase 2 队列」本轮选定 **成就/图鉴/统计页**（尚未动工，实施清单如下）。

### v4 实施清单

1. `src/engine/types.ts`：`SAVE_VERSION = 4`；meta 增加 `monsterKills: Record<string, number>`（图鉴）与 `dishesCooked: number`
2. `src/engine/combat.ts` `onMonsterKilled`：`state.meta.monsterKills[id] = (…?? 0) + 1`
3. `src/engine/tick.ts` `completeCooking`：`state.meta.dishesCooked += 1`
4. `src/save/migrate.ts`：`migrateV3toV4`（补 `monsterKills: {}` / `dishesCooked: 0`），migrations 加 `3: migrateV3toV4`
5. `src/engine/initialState.ts`：两个新字段初始化
6. 新建 `src/data/achievements.ts`：派生式成就（`check(state)`，无需存档），16 条：开门营业/小队初成(3人)/满编出征(5人)/通关5·10·20层/百魔斩/千魔斩/屠魔者(10 BOSS)/魔物克星(50)/魔物美食家(全菜谱)/宴席常开(50餐)/日进斗金(1万)/传说之约/万国来朝(9种族)/见多识广(图鉴过半)/魔物百科(全收录)
7. 新建 `src/ui/CodexPanel.tsx`：统计概览（游玩时长/累计金币·经验/清波/BOSS/出餐/击杀/已解锁层）+ 成就 grid（未达成灰显🔒）+ 魔物图鉴 grid（按 FLOOR_DEFS 首次出现顺序；未发现=剪影 `filter: brightness(0)` + ？？？，已发现=精灵+击杀数）
8. `src/ui/TabNav.tsx` 加第 5 个 tab `{ id: 'codex', label: '图鉴', icon: '📖' }`；`src/App.tsx` 渲染 CodexPanel
9. `tests/engine.test.ts`：现有 v1→v3 测试期望改 `version 4`（迁移链自动串到 v4）；新增 v3→v4 字段默认、击杀计数、出餐计数、成就 check 用例

### Phase 2 剩余队列（v4 之后，按序）

酒窖饮品线 → 冒险者星级突破（吃同职业升星）→ 酒馆随机事件（拼酒/流浪商人）→ 移动端自适应打磨 → 转生系统评估

## 关键技术备忘

- **node PATH 前缀（每条命令必须）**：`$env:Path = "D:\1_Sotfware\Nodejs;C:\Users\chens\AppData\Roaming\npm;" + $env:Path`（详见 worklog 2026-09-22）
- 命令：`pnpm dev`（5173）/ `pnpm build` / `pnpm test`
- 架构分层：`engine/`（纯函数模拟）→ `store/`（Zustand 唯一状态所有者）→ `ui/`；`data/` 全部类型化内容（改数值不碰引擎）；战斗事件流 `state.events`（瞬态，serialize 剥离）→ BattleViewport 按 id 水位线回放
- 存档迁移链：`src/save/migrate.ts` 的 `migrations[n]`，当前 1→2→3
- 子代理（librarian/task 等全部类型）在本环境不可用（"Go models" 订阅错误）——直接实现，勿浪费时间重试
- Kenney 图集已验证 tile 索引（详见 worklog）：角色=行1 tile1-8（warrior=1/bard=2/ranger=3/mage=5/priest=6/rogue=7）；干净地板=tile_098；干净墙=tile_074；魔物=tiny-creatures `Tiles/`（slime=73/skeleton=71/bat=1,3/wolf=89/jellyfish=50/spider=77/golem=42,43/lizard=54,55/octopus=59/treant=82/ghost≈36）
- 用户反馈通道：试玩 → 反馈 → 修复+队列推进的节奏已建立；用户偏好迷宫饭/DND 风味
