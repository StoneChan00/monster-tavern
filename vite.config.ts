import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // GitHub Pages 项目页路径（本地 dev/preview 也会挂在该前缀下）
  base: '/monster-tavern/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
