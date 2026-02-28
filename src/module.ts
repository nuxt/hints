import { defineNuxtModule, addPlugin, createResolver, addBuildPlugin, addComponent, addServerPlugin, addServerHandler, addTemplate, addServerTemplate } from '@nuxt/kit'
import { HINTS_SSE_ROUTE } from './runtime/core/server/types'
import { setupDevToolsUI } from './devtools'
import { InjectHydrationPlugin } from './plugins/hydration'
import { LazyLoadHintPlugin } from './plugins/lazy-load'
import type { FeatureFlags, FeaturesName } from './runtime/core/types'
import { isFeatureDevtoolsEnabled, isFeatureEnabled } from './features'

// Module options TypeScript interface definition
export interface ModuleOptions {
  devtools: boolean
  features: Record<FeaturesName, boolean | FeatureFlags>
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

    const hintsConfigContent = `export const features = ${JSON.stringify(options.features)}`
    const hintsConfig = addTemplate({
      filename: '#hints-config',
      getContents: () => hintsConfigContent,
    })

    nuxt.options.alias['#hints-config'] = hintsConfig.dst

    addServerTemplate({
      filename: '#hints-config',
      getContents: () => hintsConfigContent,
    })

    // core
    addPlugin(resolver.resolve('./runtime/core/plugins/features.client'))
    addComponent({
      name: 'NuxtIsland',
      filePath: resolver.resolve('./runtime/core/components/nuxt-island'),
      priority: 1000,
    })

    // core handlers
    addServerHandler({
      route: HINTS_SSE_ROUTE,
      handler: resolver.resolve('./runtime/core/server/sse'),
    })

    // performances
    if (isFeatureEnabled(options, 'webVitals')) {
      addPlugin(resolver.resolve('./runtime/web-vitals/plugin.client'))
    }

    // hydration
    if (isFeatureEnabled(options, 'hydration')) {
      addPlugin(resolver.resolve('./runtime/hydration/plugin.client'))
      addBuildPlugin(InjectHydrationPlugin)
      addServerPlugin(resolver.resolve('./runtime/hydration/nitro.plugin'))
    }

    // lazy-load suggestions
    if (isFeatureEnabled(options, 'lazyLoad')) {
      addPlugin(resolver.resolve('./runtime/lazy-load/plugin.client'))
      if (isFeatureDevtoolsEnabled(options, 'lazyLoad')) {
        addServerPlugin(resolver.resolve('./runtime/lazy-load/nitro.plugin'))
      }
      nuxt.hook('modules:done', () => {
        // hack to ensure the plugins runs after everything else. But before vite:import-analysis
        addBuildPlugin(LazyLoadHintPlugin, { client: false })
        addBuildPlugin(LazyLoadHintPlugin, { server: false })
      })
    }

    // third-party scripts
    if (isFeatureEnabled(options, 'thirdPartyScripts')) {
      addPlugin(resolver.resolve('./runtime/third-party-scripts/plugin.client'))
      if (isFeatureDevtoolsEnabled(options, 'thirdPartyScripts')) {
        addServerPlugin(resolver.resolve('./runtime/third-party-scripts/nitro.plugin'))
      }
    }
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
