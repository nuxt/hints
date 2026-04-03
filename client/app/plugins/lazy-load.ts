import type { ComponentLazyLoadData } from '../../../src/runtime/lazy-load/schema'
import { parse } from 'valibot'
import { defineNuxtPlugin } from '#imports'
import { ComponentLazyLoadDataSchema } from '../../../src/runtime/lazy-load/schema'
import { LAZY_LOAD_ROUTE } from '../utils/routes'

export default defineNuxtPlugin(() => {
  if (import.meta.test || !useHintsFeature('lazyLoad')) return
  const nuxtApp = useNuxtApp()

  const { data: lazyLoadHints } = useLazyFetch<ComponentLazyLoadData[]>(new URL(LAZY_LOAD_ROUTE, window.location.origin).href, {
    default: () => [],
    deep: true,
  })

  nuxtApp.hook('hints:rpc:lazy-load:report', (report) => {
    try {
      const payload = parse(ComponentLazyLoadDataSchema, report)
      if (!lazyLoadHints.value.some(existing => existing.id === payload.id)) {
        lazyLoadHints.value.push(payload)
      }
    }
    catch {
      console.warn('[hints] Ignoring malformed hints:lazy-load:report event')
    }
  })

  nuxtApp.hook('hints:rpc:lazy-load:cleared', (clearedId) => {
    lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== clearedId)
  })

  return {
    provide: {
      lazyLoadHints,
    },
  }
})
