export default defineNuxtConfig({
  appId: 'playground',
  modules: ['@nuxt/eslint', '../src/module'],
  devtools: { enabled: true },
  compatibilityDate: '2025-02-26',
  eslint: {
    config: {
      stylistic: true,
    },
  },
  hints: { enabled: true, devtools: true },
})
