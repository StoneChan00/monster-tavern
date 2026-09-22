import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { initStore } from './store/gameStore';

// 先初始化存档（读档 → 迁移 → 离线结算），再挂载 UI
initStore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
