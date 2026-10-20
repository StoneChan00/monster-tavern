/**
 * Firebase 懒初始化：未配置环境变量时返回 null，云同步整体降级为不可用，
 * 单机游玩完全不受影响（这也是「游客可玩」的前提）。
 */
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';
import { CLOUD_CONFIGURED, firebaseConfig } from './config';

export interface CloudServices {
  app: FirebaseApp;
  auth: Auth;
  db: Database;
}

let pending: Promise<CloudServices | null> | null = null;

/** 取 Firebase 服务（首次调用时初始化，之后复用同一个 Promise） */
export function getCloudServices(): Promise<CloudServices | null> {
  if (!CLOUD_CONFIGURED) return Promise.resolve(null);
  if (pending) return pending;

  pending = (async () => {
    try {
      const app = getApps()[0] ?? initializeApp(firebaseConfig);
      const auth = getAuth(app);
      // 显式声明本地持久化：刷新页面后登录态保留，避免每次都要重新点登录
      await setPersistence(auth, browserLocalPersistence).catch(() => undefined);
      return { app, auth, db: getDatabase(app) };
    } catch {
      return null;
    }
  })();

  return pending;
}
