// https://nuxt.com/docs/api/configuration/nuxt-config

const COMPATIBILITYDATE = '2026-04-05'
const NUXT_BUILD_VERSION = '2026-04-05.1'

const NUXT_ENV_TYPE = import.meta.env.NUXT_ENV_TYPE || 'DEV'
const NUXT_SYSTEM_VERSION = import.meta.env.NUXT_SYSTEM_VERSION || '0.0.0'
const NUXT_BASE_URL = import.meta.env.NUXT_BASE_URL || '/'
const NUXT_PUBLIC_URL = import.meta.env.NUXT_PUBLIC_URL || '/'

const nowDate = new Date()
const [year, month, day, hour, min, second] = [
  nowDate.getFullYear(),
  `${nowDate.getMonth() + 1}`.padStart(2, '0'),
  `${nowDate.getDate()}`.padStart(2, '0'),
  `${nowDate.getHours()}`.padStart(2, '0'),
  `${nowDate.getMinutes()}`.padStart(2, '0'),
  `${nowDate.getSeconds()}`.padStart(2, '0')
]

console.log(
  '\n ------------------------------------------------------------------------ \n'
)
console.log(
  '\x1B[33m%s\x1B[0m \x1B[36m%s\x1B[0m',
  '前端服務器資訊',
  `(執行時間: ${year}-${month}-${day} ${hour}:${min}:${second})`
)
console.table({
  系統類型: NUXT_ENV_TYPE,
  系統版本: NUXT_SYSTEM_VERSION,
  Base_Url: NUXT_BASE_URL,
  Public_Url: NUXT_PUBLIC_URL,
  打包版本: NUXT_BUILD_VERSION
})
console.log('\x1B[43m%s\x1B[0m', '注意打包版本是否有更新')
console.log(
  '\n ------------------------------------------------------------------------ \n'
)

export default defineNuxtConfig({
  // ssr: false,

  modules: ['@nuxt/eslint', '@nuxt/ui'],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css', '~/assets/css/normalize.css'],

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: COMPATIBILITYDATE,

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
