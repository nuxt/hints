import { defineNuxtModule, addPlugin, createResolver, addBuildPlugin, addComponent, addServerPlugin, addServerHandler, addTemplate } from '@nuxt/kit'
import { HINTS_SSE_ROUTE } from './runtime/core/server/types'
import { setupDevToolsUI } from './devtools'
import { InjectHydrationPlugin } from './plugins/hydration'
import { LazyLoadHintPlugin } from './plugins/lazy-load'
import type { FeatureFlags } from './runtime/core/types'

// Module options TypeScript interface definition
export interface ModuleOptions {
  devtools: boolean
  features: Record<'hydration' | 'lazyLoad' | 'webVitals' | 'thirdPartyScripts', boolean | FeatureFlags>
}
  
const moduleName = '@nuxt/hints'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: moduleName,
    configKey: 'hints',
  },
  defaults: {
    devtools: true,
    features: {
      hydration: true,
      lazyLoad: true,
      webVitals: true,
      thirdPartyScripts: true,
    },
  },
  setup(options, nuxt) {
    if (!nuxt.options.dev) {
      return
    }
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.websocket = true

    const resolver = createResolver(import.meta.url)

    addTemplate({
      filename: 'hints.config.mjs',
      getContents() {
        return `export const features = ${JSON.stringify(booleanToFeatureFlags(options.features))};`
      }
    })

    // core
    addPlugin(resolver.resolve('./runtime/core/plugins/features.client'))
    addComponent({
      name: 'NuxtIsland',
      filePath: resolver.resolve('./runtime/core/components/nuxt-island'),
      priority: 1000,
    })

    // performances
    addPlugin(resolver.resolve('./runtime/web-vitals/plugin.client'))

    // core handlers
    addServerHandler({
      route: HINTS_SSE_ROUTE,
      handler: resolver.resolve('./runtime/core/server/sse'),
    })

    // hydration
    addPlugin(resolver.resolve('./runtime/hydration/plugin.client'))
    addBuildPlugin(InjectHydrationPlugin)
    addServerPlugin(resolver.resolve('./runtime/hydration/nitro.plugin'))

    // lazy-load suggestions
    addPlugin(resolver.resolve('./runtime/lazy-load/plugin.client'))
    addServerPlugin(resolver.resolve('./runtime/lazy-load/nitro.plugin'))
    nuxt.hook('modules:done', () => {
      // hack to ensure the plugins runs after everything else. But before vite:import-analysis
      addBuildPlugin(LazyLoadHintPlugin, { client: false })
      addBuildPlugin(LazyLoadHintPlugin, { server: false })
    })
    // third-party scripts
    addPlugin(resolver.resolve('./runtime/third-party-scripts/plugin.client'))
    addServerPlugin(resolver.resolve('./runtime/third-party-scripts/nitro.plugin'))

    nuxt.hook('prepare:types', ({ references }) => {
      references.push({
        types: resolver.resolve('./runtime/types.d.ts'),
      })
    })

    if (options.devtools) {
      setupDevToolsUI(nuxt, resolver)
      addPlugin(resolver.resolve('./runtime/core/plugins/vue-tracer-state.client'))
    }

    nuxt.options.build.transpile.push(moduleName)
  },
})

function booleanToFeatureFlags(input: Record<string, boolean | FeatureFlags>): Record<string, FeatureFlags> {
  const output: Record<string, FeatureFlags> = {}
  for (const key in input) {
    const value = input[key]
    output[key] = typeof value === 'object' ? value : { logs: Boolean(value), devtools: Boolean(value) }
  }
  return output 
}
