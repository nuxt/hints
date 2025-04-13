import { defineNuxtModule, addPlugin, createResolver } from '@nuxt/kit'
import { setupDevToolsUI } from './devtools'

// Module options TypeScript interface definition
export interface ModuleOptions {
  enabled: boolean
  devtools: boolean
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nuxt/hints',
    configKey: 'hints',
  },
  defaults: {
    enabled: false,
  },
  setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    if (options.enabled || process.env.NODE_ENV === 'development') {
      addPlugin(resolver.resolve('./runtime/plugins/performance/plugin.client'))

      if (options.devtools) {
        setupDevToolsUI(nuxt, resolver)
      }
    }
  },
})
