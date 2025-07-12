import { defineNuxtModule, addPlugin, createResolver, addBuildPlugin, addComponent, addServerPlugin } from '@nuxt/kit'
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

      // third-party scripts
      addPlugin(resolver.resolve('./runtime/plugins/third-party-scripts/plugin.client'))
      addServerPlugin(resolver.resolve('./runtime/plugins/third-party-scripts/nitro.plugin'))

      nuxt.hook('prepare:types', ({ references }) => {
        references.push({
          types: resolver.resolve('./runtime/types.d.ts'),
        })
      })

      if (options.devtools) {
        setupDevToolsUI(nuxt, resolver)
        addPlugin(resolver.resolve('./runtime/plugins/vue-tracer-state.client'))
      }
    }
  },
})
