import MyModule from '../../../src/module'

export default defineNuxtConfig({
  modules: [
    MyModule,
  ],
  build: {
    transpile: ['@nuxt/icon'],
  },
  experimental: {
    appManifest: false,
  },
  // @ts-expect-error unocss types are not available in this fixture
  unocss: {
    autoImport: false,
  },
})
