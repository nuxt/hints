import { defineNuxtPlugin, useNuxtApp, useRoute } from '#imports'
import { defu } from 'defu'
import type { DirectImportInfo, ComponentLazyLoadState, ComponentLazyLoadData } from './schema'
import { useLazyComponentTracking } from './composables'
import { logger } from '../logger'
import { LAZY_LOAD_ROUTE } from './utils'

export default defineNuxtPlugin({
  name: '@nuxt/hints:lazy-load',
  dependsOn: ['nuxt:router'],
  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.payload.__hints = defu(nuxtApp.payload.__hints, {
      lazyComponents: [],
    })

    if (import.meta.client) {
      const state = useLazyComponentTracking()
      if (!state) return

      nuxtApp.hook('app:suspense:resolve', () => {
        if (state.hasReported || state.pageLoaded) return
        state.pageLoaded = true

        // Wait a bit to allow any lazy component to render after page load
        setTimeout(() => {
          nuxtApp.runWithContext(() => checkAndReport(state))
        }, 500)
      })
    }
  },
})

function checkAndReport(state: ComponentLazyLoadState) {
  if (state.hasReported) return
  state.hasReported = true

  const suggestions: DirectImportInfo[] = []

  for (const [_, info] of state.directImports) {
    if (!info.rendered) {
      suggestions.push(info)
    }
  }

  if (suggestions.length > 0) {
    reportSuggestions(suggestions)
  }
}

function reportSuggestions(suggestions: DirectImportInfo[]) {
  const route = useRoute()
  const nuxtApp = useNuxtApp()
  nuxtApp.payload.__hints.lazyComponents = suggestions

  logger.info(
    `${suggestions.length} component has not been rendered in SSR nor rendered at hydration time. Consider lazy loading it:\n`,
  )

  for (const suggestion of suggestions) {
    const lazyName = `Lazy${suggestion.componentName}`
    logger.info(
      `${suggestion.componentName} → Use <${lazyName}> or \`defineAsyncComponent\` instead\n`
      + `  Imported from: ${suggestion.importSource}\n`
      + `  Used in: ${suggestion.importedBy}`,
    )
  }

  if (suggestions.length) {
    const payload: ComponentLazyLoadData = {
      id: `${encodeURIComponent(route.path)}-${Date.now()}`,
      route: route.path,
      state: {
        pageLoaded: true,
        hasReported: true,
        directImports: suggestions,
      },
    }

    $fetch(LAZY_LOAD_ROUTE, {
      method: 'POST',
      body: payload,
    }).catch((err) => {
      logger.warn('Failed to send lazy-load data to server:', err)
    })
  }
}
