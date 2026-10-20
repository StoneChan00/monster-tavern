import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { initStore } from './store/gameStore';
import { useCloudStore } from './store/cloudStore';

// 先初始化存档（读档 → 迁移 → 离线结算），再挂载 UI
initStore();
// 云同步是可选层：未配置 Firebase 时 init 会直接降级为 disabled
useCloudStore.getState().init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
