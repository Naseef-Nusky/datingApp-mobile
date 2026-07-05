import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const appleSignInInstalled = fs.existsSync(
  path.join(__dirname, 'node_modules', '@capacitor-community', 'apple-sign-in', 'package.json')
)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_PROXY_API || 'http://localhost:5001'

  return {
    plugins: [react()],
    resolve: {
      alias: appleSignInInstalled
        ? {}
        : {
            '@capacitor-community/apple-sign-in': path.join(
              __dirname,
              'src',
              'shims',
              'apple-sign-in-capacitor-stub.js'
            ),
          },
    },
    server: {
      port: 3001,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/socket.io': {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
  }
})













