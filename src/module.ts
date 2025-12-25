import { defineNuxtModule, addPlugin, createResolver, addBuildPlugin, addComponent, addServerPlugin, addImports, addServerHandler } from '@nuxt/kit'
import { HYDRATION_ROUTE, HYDRATION_SSE_ROUTE } from './runtime/hydration/utils'
import { setupDevToolsUI } from './devtools'
import { InjectHydrationPlugin } from './plugins/hydration'

// Module options TypeScript interface definition
export interface ModuleOptions {
  devtools: boolean
}

const moduleName = '@nuxt/hints'

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: moduleName,
    configKey: 'hints',
  },
  defaults: {
    devtools: true,
  },
  setup(options, nuxt) {
    if (!nuxt.options.dev) {
      return
    }
    nuxt.options.nitro.experimental = nuxt.options.nitro.experimental || {}
    nuxt.options.nitro.experimental.websocket = true

    const resolver = createResolver(import.meta.url)

    // core
    addComponent({
      name: 'NuxtIsland',
      filePath: resolver.resolve('./runtime/core/components/nuxt-island'),
      priority: 1000,
    })

    // performances
    addPlugin(resolver.resolve('./runtime/web-vitals/plugin.client'))

    // hydration
    addPlugin(resolver.resolve('./runtime/hydration/plugin.client'))
    addBuildPlugin(InjectHydrationPlugin)
    addServerHandler({
      route: HYDRATION_ROUTE,
      handler: resolver.resolve('./runtime/hydration/handler.nitro'),
    })
    addServerHandler({
      route: HYDRATION_SSE_ROUTE,
      handler: resolver.resolve('./runtime/hydration/sse.nitro'),
    })

    // third-party scripts
    addPlugin(resolver.resolve('./runtime/third-party-scripts/plugin.client'))
    addServerPlugin(resolver.resolve('./runtime/third-party-scripts/nitro.plugin'))

    // Imports for server side misusage detection
    addImports([
      { from: resolver.resolve('./runtime/composables/vue'), name: 'ref' },
      { from: resolver.resolve('./runtime/composables/vue'), name: 'shallowRef' },
      { from: resolver.resolve('./runtime/composables/vue'), name: 'reactive' },
      { from: resolver.resolve('./runtime/composables/vue'), name: 'shallowReactive' },
    ])

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
