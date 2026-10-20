/**
 * Firebase 配置：全部来自 Vite 环境变量（.env.local / CI secrets）。
 * 缺任何一项即视为「未启用云同步」——此时项目行为与此前纯本地版本完全一致。
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  appId: string;
}

function readEnv(key: string): string {
  const env = import.meta.env as unknown as Record<string, string | undefined>;
  return env[key] ?? '';
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: readEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID'),
  appId: readEnv('VITE_FIREBASE_APP_ID'),
};

/** 云同步是否配置齐全（databaseURL 必需：存档走 Realtime Database） */
export const CLOUD_CONFIGURED =
  firebaseConfig.apiKey !== '' &&
  firebaseConfig.authDomain !== '' &&
  firebaseConfig.databaseURL !== '' &&
  firebaseConfig.projectId !== '';

/** 云存档单个档的大小上限：正常档只有几 KB，超过说明是异常提交 */
export const MAX_CLOUD_BYTES = 512 * 1024;
