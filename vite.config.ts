import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // @를 사용하여 소스 폴더를 쉽게 참조하도록 설정
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Vercel 빌드 시 환경 변수를 자동으로 주입받기 위한 설정
  define: {
    'process.env': {},
  },
  server: {
    // 로컬 개발 환경 설정
    port: 3000,
    host: true,
  },
});
