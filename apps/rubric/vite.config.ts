import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const rawClerk = (
    env.VITE_CLERK_PUBLISHABLE_KEY ||
    env.CLERK_PUBLISHABLE_KEY ||
    env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.VITE_CLERK_PUBLISHABLE_KEY ||
    process.env.CLERK_PUBLISHABLE_KEY ||
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    ''
  ).trim();

  const clerkMatch = rawClerk.match(/(pk_(test|live)_[a-zA-Z0-9_-]+)/);
  const clerkKey = (clerkMatch ? clerkMatch[1] : rawClerk.replace(/^["']|["']$/g, '')).trim();

  const apiBaseUrl = (
    env.VITE_API_BASE_URL ||
    env.API_BASE_URL ||
    process.env.VITE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    'https://bloodchain-api.onrender.com'
  ).replace(/^["']|["']$/g, '').trim();

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkKey),
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
      'process.env.CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkKey),
      'process.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
    },
    server: {
      port: 5176,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  };
});

