export default defineNuxtConfig({
  appId: 'playground',
  modules: ['@nuxt/eslint', '@nuxt/hints'],
  devtools: { enabled: true },
  compatibilityDate: '2025-02-26',
  eslint: {
    config: {
      stylistic: true,
    },
  },
  hints: { devtools: true,
    features: {
      lazyLoad: false,
    },
  },
})
