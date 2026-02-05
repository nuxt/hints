import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { defu } from 'defu'
import type { DirectImportInfo, LazyHydrationState } from './composables'
import { useLazyComponentTracking } from './composables'
import { logger } from '../logger'

export default defineNuxtPlugin({
  name: '@nuxt/hints:lazy-hydration',
  setup() {
    const nuxtApp = useNuxtApp()

    nuxtApp.__hints = defu(nuxtApp.__hints, {
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
          checkAndReport(state, nuxtApp)
        }, 500)
      })
    }
  },
})

function checkAndReport(state: LazyHydrationState, nuxtApp: ReturnType<typeof useNuxtApp>) {
  if (state.hasReported) return
  state.hasReported = true

  const suggestions: DirectImportInfo[] = []

  for (const [_, info] of state.directImports) {
    if (!info.rendered) {
      suggestions.push(info)
    }
  }

  if (suggestions.length > 0) {
    reportSuggestions(suggestions, nuxtApp)
  }
}

function reportSuggestions(suggestions: DirectImportInfo[], nuxtApp: ReturnType<typeof useNuxtApp>) {
  nuxtApp.__hints.lazyComponents = suggestions

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
}
