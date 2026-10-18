import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import deployment from './vercel.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'production-rewrites-in-preview',
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url || '/', 'http://localhost');
        const rule = deployment.rewrites.find(rule => rule.source === url.pathname);
        if (rule) request.url = rule.destination + url.search;
        next();
      });
    },
  }],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ }],
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
})
