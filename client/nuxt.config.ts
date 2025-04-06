import { resolve } from 'pathe'

export default defineNuxtConfig({
  ssr: false,

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@nuxt/devtools-ui-kit',
    '@nuxt/icon',
  ],

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  app: {
    baseURL: '/__nuxt-hints',
  },

  vite: {
    server: {
      hmr: {
        // Instead of go through proxy, we directly connect real port of the client app
        clientPort: +(process.env.PORT || 3300),
      },
      allowedHosts: true
    },
  },

  devtools: {
    enabled: false,
  },

  compatibilityDate: '2024-08-21',
})
