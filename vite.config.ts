import { fileURLToPath, URL } from 'node:url'
import type { UserConfigExport, UserConfig, UserConfigFnObject } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const userConfigFnObject: UserConfigFnObject = ({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const VITE_API_BASE_URL = env.VITE_API_BASE_URL
  const VITE_API_BUILD_VERSION = env.VITE_API_BUILD_VERSION
  const VITE_API_VERSION = env.VITE_API_VERSION

  const nowDate = new Date()
  const [year, month, day, hour, min, second] = [
    nowDate.getFullYear(),
    `${nowDate.getMonth() + 1}`.padStart(2, '0'),
    `${nowDate.getDate()}`.padStart(2, '0'),
    `${nowDate.getHours()}`.padStart(2, '0'),
    `${nowDate.getMinutes()}`.padStart(2, '0'),
    `${nowDate.getSeconds()}`.padStart(2, '0')
  ]

  const isDevelopment = mode === 'development'

  console.log(
    '\n ------------------------------------------------------------------------ \n'
  )
  console.log(
    '\x1B[33m%s\x1B[0m \x1B[36m%s\x1B[0m',
    '前端服務器資訊',
    `(執行時間: ${year}-${month}-${day} ${hour}:${min}:${second})`
  )
  console.table({
    URL: VITE_API_BASE_URL,
    是否是開發模式: isDevelopment,
    系統版本: VITE_API_VERSION,
    指令: command,
    模式: mode,
    打包版本: VITE_API_BUILD_VERSION
  })
  console.log(
    '\n ------------------------------------------------------------------------ \n'
  )

  return {
    base: VITE_API_BASE_URL,
    build: {
      outDir: 'dist'
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: 6060,
      host: '0.0.0.0',
      open: false
    },
    resolve: {
      // extensions: ['.tsx', '.json', '.js', '.ts'],
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        $: fileURLToPath(new URL('./public', import.meta.url)),
        'vue-i18n': 'vue-i18n/dist/vue-i18n.cjs.js'
      }
    }
  }
}

const viteConfig: UserConfigExport = defineConfig(userConfigFnObject)

export default viteConfig as UserConfig
