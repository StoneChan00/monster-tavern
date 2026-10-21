/**
 * 云同步状态机（zustand）：登录态、同步状态、冲突处理，全部集中在这里。
 *
 * 设计原则：
 *   - 游客可玩：未登录/未配置时等价于纯本地版本，任何异常都不能阻塞单机游玩
 *   - 本地优先：本地存档永远是主副本，云端只是副本；推送失败只更新提示，不丢档
 *   - 冲突不静默：写云端一律带版本号守卫，发现别的设备改过就停下来问玩家
 *
 * Firebase SDK 走动态 import：未配置云同步的部署（例如当前 Pages）不会下载这 200KB+。
 */
import { create } from 'zustand';
import type { Auth } from 'firebase/auth';
import type { Database } from 'firebase/database';
import { CLOUD_CONFIGURED, MAX_CLOUD_BYTES } from '../cloud/config';
import { decideSyncAction, extractSavedAt, looksLikeFreshSave } from '../cloud/decision';
import { getDeviceId, loadMeta, saveMeta } from '../cloud/meta';
import { onLocalSave } from '../save/bus';
import { useGameStore } from './gameStore';

export type CloudStatus =
  /** 未配置 Firebase：整个云同步层不出现 */
  | 'disabled'
  | 'signed-out'
  /** 已登录，等待下次同步 */
  | 'idle'
  | 'syncing'
  | 'synced'
  /** 本机与云端都有新进度，等玩家选 */
  | 'conflict'
  | 'error';

export interface CloudUser {
  uid: string;
  name: string;
  photo: string | null;
}

export interface CloudConflict {
  localSavedAt: number | null;
  remoteSavedAt: number;
  remoteRev: number;
}

/** 支持的第三方登录方式 */
export type CloudProvider = 'google' | 'github';

interface CloudStore {
  status: CloudStatus;
  user: CloudUser | null;
  lastSyncAt: number | null;
  conflict: CloudConflict | null;
  /** 一次性提示（「已载入云端存档」「同步失败」等） */
  message: string | null;
  init: () => void;
  signIn: (provider?: CloudProvider) => Promise<void>;
  signOutNow: () => Promise<void>;
  /** 手动上传本地档（覆盖云端） */
  uploadLocal: () => Promise<void>;
  /** 手动下载云端档（覆盖本地） */
  downloadCloud: () => Promise<void>;
  /** 冲突：采用云端 */
  takeCloud: () => Promise<void>;
  /** 冲突：用本地覆盖云端 */
  overwriteCloud: () => Promise<void>;
  dismissConflict: () => void;
}

/** 自动推送间隔：本地 30s 自动存档，云端 2 分钟推一次即可 */
const CLOUD_PUSH_INTERVAL_MS = 120_000;

type AuthApi = typeof import('firebase/auth');
type StoreApi = typeof import('../cloud/cloudSave');

interface CloudModules {
  auth: Auth;
  db: Database;
  authApi: AuthApi;
  storeApi: StoreApi;
}

let modulesPromise: Promise<CloudModules | null> | null = null;
let dirty = false;
let pushing = false;
let started = false;

/** 动态加载 Firebase SDK + 存档 API；未配置时返回 null */
function loadCloudModules(): Promise<CloudModules | null> {
  if (!CLOUD_CONFIGURED) return Promise.resolve(null);
  modulesPromise ??= (async () => {
    const [firebase, authApi, storeApi] = await Promise.all([
      import('../cloud/firebase'),
      import('firebase/auth'),
      import('../cloud/cloudSave'),
    ]);
    const services = await firebase.getCloudServices();
    if (!services) return null;
    return { auth: services.auth, db: services.db, authApi, storeApi };
  })();
  return modulesPromise;
}

function localRaw(): string {
  return useGameStore.getState().exportSaveString();
}

/** 把云端存档灌进引擎（含校验与版本迁移），并立刻落本地 */
function applyRemoteJson(json: string): boolean {
  const result = useGameStore.getState().importSaveString(json);
  if (!result.ok) return false;
  useGameStore.getState().saveNow();
  return true;
}

/** 记录同步基线：下次据此判断本机/远端各自有没有新进度 */
function recordSync(uid: string, rev: number, localSavedAt: number | null): void {
  saveMeta({
    uid,
    baseRev: rev,
    lastSyncedLocalSavedAt: localSavedAt,
    lastSyncedAt: Date.now(),
    deviceId: getDeviceId(),
  });
  dirty = false;
}

/** 推送本地档到云端；force = 玩家明确选择覆盖云端 */
async function pushNow(force: boolean): Promise<void> {
  const user = useCloudStore.getState().user;
  if (!user || pushing) return;

  const raw = localRaw();
  if (raw.length > MAX_CLOUD_BYTES) {
    useCloudStore.setState({ status: 'error', message: '本地存档过大（>512KB），已跳过云同步' });
    return;
  }

  const modules = await loadCloudModules();
  if (!modules) return;

  const meta = loadMeta(user.uid);
  // 从未同步过 → 期望云端为空；否则按上次同步的 rev 做守卫
  const expectedRev = meta.lastSyncedAt > 0 ? meta.baseRev : null;

  pushing = true;
  useCloudStore.setState({ status: 'syncing', message: null });
  try {
    const result = await modules.storeApi.pushCloud(modules.db, user.uid, raw, { expectedRev, force });
    if (result.kind === 'ok') {
      recordSync(user.uid, result.rev, extractSavedAt(raw));
      useCloudStore.setState({ status: 'synced', lastSyncAt: Date.now(), conflict: null, message: null });
      return;
    }
    if (result.kind === 'conflict') {
      const remote = await modules.storeApi.readCloud(modules.db, user.uid).catch(() => null);
      useCloudStore.setState({
        status: 'conflict',
        conflict: {
          localSavedAt: extractSavedAt(raw),
          remoteSavedAt: remote?.savedAt ?? 0,
          remoteRev: remote?.rev ?? 0,
        },
      });
      return;
    }
    useCloudStore.setState({
      status: 'error',
      message: result.kind === 'too-large' ? '本地存档过大，已跳过云同步' : '本地存档格式异常，已跳过云同步',
    });
  } catch (err) {
    console.error('[cloud] push failed:', err);
    useCloudStore.setState({ status: 'error', message: describeSyncError(err, '上传') });
  } finally {
    pushing = false;
  }
}

/** 拉取云端档覆盖本地 */
async function pullNow(): Promise<void> {
  const user = useCloudStore.getState().user;
  if (!user) return;

  const modules = await loadCloudModules();
  if (!modules) return;

  useCloudStore.setState({ status: 'syncing', message: null });
  try {
    const remote = await modules.storeApi.readCloud(modules.db, user.uid);
    if (!remote) {
      useCloudStore.setState({ status: 'idle', message: '云端还没有存档，下次自动上传本地档' });
      return;
    }
    if (remote.json.length > MAX_CLOUD_BYTES || extractSavedAt(remote.json) === null) {
      useCloudStore.setState({ status: 'error', message: '云端存档无法识别，已保留本地进度' });
      return;
    }
    if (!applyRemoteJson(remote.json)) {
      useCloudStore.setState({ status: 'error', message: '云端存档无法识别（版本或格式不符），已保留本地进度' });
      return;
    }
    recordSync(user.uid, remote.rev, extractSavedAt(localRaw()));
    useCloudStore.setState({ status: 'synced', lastSyncAt: Date.now(), conflict: null, message: '已载入云端存档' });
  } catch (err) {
    console.error('[cloud] pull failed:', err);
    useCloudStore.setState({ status: 'error', message: describeSyncError(err, '下载') });
  }
}

/** 登录成功后的首次同步：按版本号/时间戳决定上传、下载还是交给玩家 */
async function resolveInitial(user: CloudUser): Promise<void> {
  const modules = await loadCloudModules();
  if (!modules) return;

  try {
    const remote = await modules.storeApi.readCloud(modules.db, user.uid);
    const meta = loadMeta(user.uid);
    const action = decideSyncAction({
      localSavedAt: extractSavedAt(localRaw()),
      lastSyncedLocalSavedAt: meta.lastSyncedLocalSavedAt,
      baseRev: meta.baseRev,
      remoteRev: remote?.rev ?? null,
      remoteUpdatedAt: remote?.updatedAt ?? null,
    });

    if (action === 'upload') {
      await pushNow(false);
      return;
    }
    if (action === 'download') {
      await pullNow();
      return;
    }
    if (action === 'in-sync') {
      recordSync(user.uid, remote?.rev ?? meta.baseRev, extractSavedAt(localRaw()));
      useCloudStore.setState({ status: 'synced', lastSyncAt: Date.now(), message: null });
      return;
    }

    // 冲突：新设备上的初始档不算「有进度」，直接载入云端，免得打扰玩家
    if (looksLikeFreshSave(useGameStore.getState().state)) {
      await pullNow();
      return;
    }
    useCloudStore.setState({
      status: 'conflict',
      conflict: {
        localSavedAt: extractSavedAt(localRaw()),
        remoteSavedAt: remote?.savedAt ?? 0,
        remoteRev: remote?.rev ?? 0,
      },
    });
  } catch (err) {
    console.error('[cloud] resolveInitial failed:', err);
    useCloudStore.setState({ status: 'error', message: describeSyncError(err, '同步') });
  }
}

/** 离开页面/切后台时把待同步的进度推上去（尽力而为，失败不阻塞关闭） */
function flush(): void {
  if (!dirty) return;
  void pushNow(false);
}

/** 取错误的机器码：Firebase 通常放在 err.code，兜底用 message */
function errorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) return String((err as { code: unknown }).code);
  return err instanceof Error ? err.message : String(err);
}

/** 把 Firebase 认证错误翻译成可执行的中文提示（原始错误已 console.error 保留） */
function describeAuthError(err: unknown): string {
  const code = errorCode(err);
  const host = typeof location !== 'undefined' ? location.hostname : '当前域名';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return '登录已取消';
    case 'auth/cancelled-popup-request':
      return '登录被打断，请重试';
    case 'auth/popup-blocked':
      return '浏览器拦截了登录弹窗，请允许弹窗后重试';
    case 'auth/account-exists-with-different-credential':
      return '该邮箱已经用另一种方式登录过，请改用上次的方式（同一邮箱用不同登录方式会有两份独立存档）';
    case 'auth/unauthorized-domain':
      return `域名 ${host} 未获授权：需在 Firebase「身份验证 → 设置 → 授权域名」添加`;
    case 'auth/network-request-failed':
      return '连不上 Google 登录服务（需要代理），云同步暂不可用';
    case 'auth/operation-not-supported-in-this-environment':
      return '当前环境不支持弹窗登录，请改用 https 地址或其他浏览器';
    case 'auth/internal-error':
      return '登录服务内部错误，稍后重试（不影响单机游玩）';
    default:
      return code ? `登录失败（${code}），不影响单机游玩` : '登录失败，不影响单机游玩';
  }
}

/** 把云端读写错误翻译成可执行的中文提示（原始错误已 console.error 保留） */
function describeSyncError(err: unknown, action: string): string {
  const code = errorCode(err);
  if (/permission_denied/i.test(code)) {
    return '云端读写被拒绝：Realtime Database 规则未发布或与代码不匹配（见 docs/cloud-save.md 第 4 节）';
  }
  if (/unavailable|network|disconnect|timeout|offline/i.test(code)) {
    return `${action}失败：连不上云端（网络），进度仍在本地`;
  }
  if (/invalid_token|token_expired|unauthorized|auth\//i.test(code)) {
    return '登录态已失效，请重新登录后再同步';
  }
  return code ? `${action}失败（${code.slice(0, 60)}），进度仍在本地` : `${action}失败，进度仍在本地`;
}

export const useCloudStore = create<CloudStore>((set, get) => ({
  status: CLOUD_CONFIGURED ? 'signed-out' : 'disabled',
  user: null,
  lastSyncAt: null,
  conflict: null,
  message: null,

  init: () => {
    if (started) return;
    started = true;
    if (!CLOUD_CONFIGURED) {
      set({ status: 'disabled' });
      return;
    }

    // 本地存档写入 → 标脏，由定时器/离开页面触发推送
    onLocalSave(() => {
      dirty = true;
    });
    if (typeof window !== 'undefined') {
      window.setInterval(() => {
        const status = get().status;
        if (dirty && status !== 'conflict' && status !== 'error') void pushNow(false);
      }, CLOUD_PUSH_INTERVAL_MS);
      window.addEventListener('pagehide', flush);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) flush();
      });
    }

    void loadCloudModules().then((modules) => {
      if (!modules) {
        set({ status: 'disabled', message: '云同步初始化失败，进度仍保存在本地' });
        return;
      }
      modules.authApi.onAuthStateChanged(modules.auth, (u) => {
        if (!u) {
          set({ user: null, status: 'signed-out', conflict: null, message: null });
          return;
        }
        const user: CloudUser = { uid: u.uid, name: u.displayName ?? '冒险者', photo: u.photoURL ?? null };
        set({ user });
        void resolveInitial(user);
      });
    });
  },

  signIn: async (provider = 'google') => {
    const modules = await loadCloudModules();
    if (!modules) return;
    try {
      const authProvider =
        provider === 'github'
          ? new modules.authApi.GithubAuthProvider()
          : new modules.authApi.GoogleAuthProvider();
      if (provider === 'google') authProvider.setCustomParameters({ prompt: 'select_account' });
      await modules.authApi.signInWithPopup(modules.auth, authProvider);
      // 登录成功后由 onAuthStateChanged → resolveInitial 接管
    } catch (err) {
      // 原始错误留在控制台，便于排查；顶栏只显示可执行的中文提示
      console.error('[cloud] signIn failed:', err);
      set({ status: 'error', message: describeAuthError(err) });
    }
  },

  signOutNow: async () => {
    const modules = await loadCloudModules();
    if (!modules) return;
    // 退出前把进度推一次，避免刚玩的进度只留在本地
    if (get().user) await pushNow(false);
    try {
      await modules.authApi.signOut(modules.auth);
    } catch {
      /* 忽略：本地登录态会由 onAuthStateChanged 兜底 */
    }
    set({ user: null, status: 'signed-out', conflict: null, message: null });
  },

  uploadLocal: () => pushNow(true),
  downloadCloud: () => pullNow(),
  takeCloud: () => pullNow(),
  overwriteCloud: () => pushNow(true),

  dismissConflict: () => set({ conflict: null, status: 'idle', message: '已跳过本次同步，稍后会自动重试' }),
}));
