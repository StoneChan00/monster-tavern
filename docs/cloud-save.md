# 云存档（Firebase Auth + Realtime Database）

> 目标：**每个玩家一份自己的存档，换设备登录后能接着玩**。不登录也能完整游玩，云存档只是多一份副本。

- 身份：Firebase Authentication，Google 登录（只请求 `openid email profile`，不碰 Drive 等敏感范围，**无需 Google OAuth 审核**）
- 存档：Firebase Realtime Database，路径 `saves/{uid}`，每个用户一个节点
- 本机存档仍是主副本：`localStorage` + `monster-tavern:save`，云端只是备份/接力

## 1. 前置准备（约 15 分钟）

1. 打开 [Firebase 控制台](https://console.firebase.google.com/) → **添加项目**（就是 Google Cloud 项目的壳，免费 Spark 计划即可）
2. 左侧 **构建 → Authentication → 开始使用**
   - 登录方法 → 启用 **Google**
   - 填一个项目公开名称（出现在授权页上）
3. 左侧 **构建 → Realtime Database → 创建数据库**
   - 位置选最近的区域（如 `asia-southeast1`）
   - 初始规则选「**锁定模式**」（稍后贴第 4 节的规则）
   - 记下 `databaseURL`（形如 `https://xxx-default-rtdb.asia-southeast1.firebasedatabase.app`）
4. 左侧 **项目设置 → 常规 → 你的应用 → Web 应用**（没有就新建一个）
   - 复制配置里的 `apiKey` / `authDomain` / `databaseURL` / `projectId` / `appId`
5. 左侧 **Authentication → 设置 → 授权域名**，确认包含：
   - `localhost`（默认已有）
   - `stonechan00.github.io`（线上域名，**只填域名，不带路径**）
6. 若在 GitHub Pages 上线：把 5 个环境变量写进 CI（见第 3 节）

## 2. 数据模型

```jsonc
// saves/{uid}
{
  "json": "<migrate.serialize() 产生的存档原文>", // 自带 magic/version/exportedAt
  "rev": 12,                    // 单调递增，用于检测「别的设备写过」
  "savedAt": 1760000000000,      // 写入时存档内部 exportedAt 的快照
  "deviceId": "9f2a1c3d",        // 写入方设备（8 位随机 id）
  "updatedAt": 1760000000123     // 客户端写入时刻
}
```

本机另存一份同步基线（不参与存档内容）：

```jsonc
// localStorage: monster-tavern:cloud-meta
{ "uid": "...", "baseRev": 12, "lastSyncedLocalSavedAt": 1760000000000,
  "lastSyncedAt": 1760000000123, "deviceId": "9f2a1c3d" }
```

## 3. 环境变量

复制 `.env.example` 为 `.env.local` 并填值（`.env*` 已在 `.gitignore` 里）：

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

这些值都是公开信息（前端可见）。**真正的访问控制在数据库规则里**，不要试图靠隐藏 apiKey 做安全。

### 线上构建（GitHub Pages）

本仓库采用**提交 `.env.production`** 的方式：Vite 在生产构建时自动读取，CI 不需要任何 Secrets 配置。

```
# .env.production（已入库，值与 .env.local 一致）
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
```

因为这几个值本来就会打包进前端 JS（任何人 DevTools 可见），入库不构成泄密；安全边界是第 4 节的数据库规则。

> ⚠️ 一个容易踩的坑：`process.env` 里已存在的变量**优先级高于** `.env.*` 文件。如果你的 workflow 写了
> `env: VITE_FIREBASE_API_KEY: ${{ secrets.X }}` 而 secrets 没配，注入的是**空字符串**，
> 会把 `.env.production` 覆盖成空 → 云同步被关闭、登录按钮消失。本仓库的 workflow 因此**不注入**这些变量。
> 若你更想用 Secrets，请同时删掉 `.env.production`（或改成 `.env.production.local`，它已被 gitignore）。

未配置时构建照常成功，游戏退化为纯本地版本（顶栏不出现登录按钮）。

## 4. Realtime Database 安全规则

贴到 **Realtime Database → 规则**：

```json
{
  "rules": {
    "saves": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['json', 'rev', 'savedAt'])",
        "json": {
          ".validate": "newData.isString() && newData.val().length < 524288"
        },
        "rev": {
          ".validate": "newData.isNumber() && newData.val() >= 1 && (!data.exists() || newData.val() > data.val())"
        },
        "savedAt": { ".validate": "newData.isNumber()" },
        "deviceId": { ".validate": "newData.isString() && newData.val().length <= 32" },
        "updatedAt": { ".validate": "newData.isNumber()" },
        "$other": { ".validate": false }
      }
    }
  }
}
```

要点：

- 只能读写 `saves/{自己的 uid}`，别人的路径一律拒绝
- `rev` 只允许递增，防止回滚覆盖
- `json` 限长 512KB，`$other` 拒绝多余字段

## 5. 行为规格

### 登录时的首次同步

| 情况 | 动作 |
| --- | --- |
| 云端没有档 | 上传本地档（首次登录的老玩家） |
| 本地没有可解析的档 | 下载云端档 |
| 云端 `rev` 仍是上次同步的基线，且本地有更新 | 上传本地档 |
| 云端 `rev` 仍是基线，本地也没更新 | 什么都不做 |
| 云端被别的设备改过，且比本地更晚 | 下载云端档 |
| 云端被改过，但本地更晚 | **弹冲突弹窗**，玩家选 |
| 冲突 + 本地是「几乎没玩过」的新档 | 直接下载云端档（新设备登录不打扰） |

「几乎没玩过」判定：`meta.totalWavesCleared === 0 && roster.length <= 1`。

### 同步时机

- 本地存档每 30s 自动写一次（`BALANCE.AUTOSAVE_INTERVAL_S`），每次写都会标脏
- 云端每 **2 分钟**推一次（`CLOUD_PUSH_INTERVAL_MS`），另有 `pagehide` / 切后台时立即推
- 所有自动推送都带 `rev` 守卫：远端变了就停下并弹冲突，**绝不静默覆盖**
- 手动 ⏫ 上传 = 强制覆盖云端；手动 ⏬ 下载 = 强制覆盖本地（按钮 title 已写明后果）

### 退出登录

退出前会把进度推一次；本机存档保留，随时可以继续不登录游玩。

### 多种登录方式（Google / GitHub）

顶栏提供两个登录入口，都是 Firebase Authentication 的第三方提供方：

- Google：Firebase 内置托管，**不需要**自建 OAuth 客户端
- GitHub：需要先在 GitHub 建 OAuth App，回调地址填
  `https://<project>.firebaseapp.com/__/auth/handler`，再把 Client ID / Secret 填进 Firebase 的 GitHub 提供方

⚠️ **存档按 `uid` 隔离，而 uid 是「提供方 + 账号」的组合**。同一个人的 Google 账号和 GitHub 账号是两个不同的 uid，因此会有**两份互相独立的云端存档**，切登录方式等于换档。

Firebase 在开启「每个邮箱一个账号」时会直接拒绝这种冲突并抛
`auth/account-exists-with-different-credential`，UI 会提示「请改用上次的登录方式」。

如果需要「同一玩家多种登录方式共用一份存档」，必须做**账号关联**（`linkWithCredential`）：
先用一种方式登录，再在设置里关联另一种。本 POC 未实现，建议先只对外提供一种登录方式。

## 6. 本地验证（两台「设备」）

1. `pnpm dev` → `http://localhost:5173/monster-tavern/`
2. 正常窗口开一个，登录账号 A，玩到有进度 → 顶栏状态应显示「已同步」
3. 隐身窗口打开同一地址（= 另一台设备），登录同一个账号 A → 应自动载入云端进度
4. 验证冲突：在隐身窗口玩几分钟（本地更新），同时在正常窗口点 ⏫ 上传 → 回到隐身窗口点 ⏬ 或等 2 分钟自动推 → 应弹出「发现两份存档」
5. 验证隔离：换成账号 B 登录，应拿到空云端（看不到 A 的档）

## 7. 免费额度与规模

Firebase Spark（免费）Realtime Database：**1GB 存储 / 10GB 月下载 / 100 并发连接**。
存档只有几 KB，2 分钟一次写入 → 单玩家每天约 480 次写。Spark 计划对 RTDB 写入次数不单独计费，限制主要在并发连接（100），适合小规模内测；上量后升级 Blaze（按流量计费，成本很低）。

> 注意：**不要**换成 Firestore。Firestore 免费额度是 2 万次写/天，按 2 分钟一次的节奏只够十几个玩家，写配额会先炸。

## 8. 已知限制（POC 范围）

- 单档位：一个账号一份存档，没有「多存档槽」
- 冲突只能二选一（没有按内容自动合并）；建议玩家先「导出存档」留底
- 客户端存档天然可改，没有反作弊；若将来要做排行榜/交易，需要服务端校验数值
- 弱网下推送失败只提示、不重试排队；下次写入会自然重试
- 未实现账号合并（例如先用 Google A 玩，后来想并入账号 B）
