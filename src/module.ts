import { defineNuxtModule, addPlugin, createResolver, addBuildPlugin, addComponent } from '@nuxt/kit'
import { setupDevToolsUI } from './devtools'
import { InjectHydrationPlugin } from './plugins/hydration'

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
      // performances
      addPlugin(resolver.resolve('./runtime/plugins/performance/plugin.client'))

      // hydration
      addPlugin(resolver.resolve('./runtime/plugins/hydration/plugin.client'))
      addBuildPlugin(InjectHydrationPlugin)
      addComponent({
        name: 'NuxtIsland',
        filePath: resolver.resolve('./runtime/components/nuxt-island.ts'),
        priority: 1000,
      })

      if (options.devtools) {
        setupDevToolsUI(nuxt, resolver)
        addPlugin(resolver.resolve('./runtime/plugins/vue-tracer-state.client'))
      }
    }
  },
})
