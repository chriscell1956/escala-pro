import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Alterado para a porta padrão do Vite para evitar conflito com o backend
    port: 5173, 
  },
  build: {
    outDir: 'dist',
  }
});
