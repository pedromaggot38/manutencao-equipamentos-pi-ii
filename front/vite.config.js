import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A URL da API é lida em tempo de execução (window.__API_URL__, definido no index.html
// ou injetado via variável de ambiente no build). Veja src/api/client.js.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
