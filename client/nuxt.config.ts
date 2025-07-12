import { createResolver } from '@nuxt/kit'
import { resolve } from 'pathe'

const resolver = createResolver(import.meta.url)

export default defineNuxtConfig({
  appId: 'nuxt-hints-iframe',
  modules: [
    '@nuxt/devtools-ui-kit',
    '@nuxt/icon',
  ], ssr: false,

  devtools: {
    enabled: false,
  },

  app: {
    baseURL: '/__nuxt-hints',
  },
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-08-21',

  nitro: {
    output: {
      publicDir: resolve(__dirname, '../dist/client'),
    },
  },

  vite: {
    server: {
      hmr: {
        // Instead of go through proxy, we directly connect real port of the client app
        clientPort: +(process.env.PORT || 3300),
      },
      allowedHosts: true,
    },
  },

  hooks: {
    'prepare:types': ({ references }) => {
      references.push({
        types: resolver.resolve('../src/runtime/types.d.ts'),
      })
    },
  },
})
