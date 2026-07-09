export default defineNuxtConfig({
  appId: 'playground',
  modules: ['@nuxt/eslint', '@nuxt/hints'],
  devtools: { enabled: true },
  compatibilityDate: '2025-02-26',
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'vite-plugin-vue-tracer/client/overlay',
        'vite-plugin-vue-tracer/client/record',
        'web-vitals/attribution',
      ],
    },
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  hints: { devtools: true },
})
