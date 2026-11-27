import { defineNuxtModule, addPlugin, createResolver, addBuildPlugin, addComponent, addNitroPlugin, addTemplate } from '@nuxt/kit'
import { setupDevToolsUI } from './devtools'
import { InjectHydrationPlugin } from './plugins/hydration'
import { LazyLoadHintPlugin } from './plugins/lazy-load'
import type { Features } from './runtime/core/types'
import { isFeatureDevtoolsEnabled, isFeatureEnabled } from './features'
import { HINTS_ROUTE } from './runtime/core/server/types'
import { joinURL } from 'ufo'

// Module options TypeScript interface definition
export interface ModuleOptions {
  devtools: boolean
  features: Partial<Features>
}

const moduleName = '@nuxt/hints'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: moduleName,
    configKey: 'hints',
    compatibility: {
      // `nuxt/server` hooks and per-server-API dev handlers
      nuxt: '>=4.6.0',
    },
  },
  defaults: {
    devtools: true,
    features: {
      hydration: true,
      lazyLoad: true,
      webVitals: true,
      thirdPartyScripts: true,
      htmlValidate: true,
    },
  },
  setup(options, nuxt) {
    if (!nuxt.options.dev) {
      return
    }
    const resolver = createResolver(import.meta.url)

    const hintsConfig = addTemplate({
      filename: 'hints-config.mjs',
      getContents: () => [
        `export const features = ${JSON.stringify(options.features)}`,
        `export const apiRoute = ${JSON.stringify(joinURL(nuxt.options.app.baseURL, HINTS_ROUTE))}`,
        `export const devServerOrigin = ${JSON.stringify(options.devtools ? getDevServerOrigin(nuxt.options.devServer.url) : null)}`,
      ].join('\n'),
      write: true,
    })

    nuxt.options.alias['#shared/hints-config'] = hintsConfig.dst

    // core
    addPlugin(resolver.resolve('./runtime/core/plugins/features.client'))
    addComponent({
      name: 'NuxtIsland',
      filePath: resolver.resolve('./runtime/core/components/nuxt-island'),
      priority: 1000,
    })

    // performances
    if (isFeatureEnabled(options, 'webVitals')) {
      addPlugin(resolver.resolve('./runtime/web-vitals/plugin.client'))
    }

    // hydration
    if (isFeatureEnabled(options, 'hydration')) {
      addPlugin(resolver.resolve('./runtime/hydration/plugin.client'))
      addBuildPlugin(InjectHydrationPlugin)
    }

    // lazy-load suggestions
    if (isFeatureEnabled(options, 'lazyLoad')) {
      addPlugin(resolver.resolve('./runtime/lazy-load/plugin.client'))
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
        addNitroPlugin(resolver.resolve('./runtime/third-party-scripts/nitro.plugin'))
      }
    }

    // html-validate
    if (isFeatureEnabled(options, 'htmlValidate')) {
      addPlugin(resolver.resolve('./runtime/html-validate/plugin.client'))
      addNitroPlugin(resolver.resolve('./runtime/html-validate/nitro.plugin'))
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

/** Origin the Nitro server reaches the dev server on; a wildcard bind address is not connectable everywhere (Windows). */
function getDevServerOrigin(url: string | undefined): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === '0.0.0.0' || parsed.hostname === '[::]') parsed.hostname = 'localhost'
    return parsed.origin
  }
  catch {
    return null
  }
}
