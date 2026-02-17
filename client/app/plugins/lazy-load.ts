import type { ComponentLazyLoadData } from '../../../src/runtime/lazy-load/schema'
import { parse } from 'valibot'
import { defineNuxtPlugin } from '#imports'
import { ComponentLazyLoadDataSchema } from '../../../src/runtime/lazy-load/schema'
import { LAZY_LOAD_ROUTE } from '../../../src/runtime/lazy-load/utils'

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()

  const { data: lazyLoadHints } = useLazyFetch<ComponentLazyLoadData[]>(new URL(LAZY_LOAD_ROUTE, window.location.origin).href, {
    default: () => [],
    deep: true,
  })

  const lazyLoadReportHandler = (event: MessageEvent) => {
    try {
      const payload = parse(ComponentLazyLoadDataSchema, JSON.parse(event.data))
      if (!lazyLoadHints.value.some(existing => existing.id === payload.id)) {
        lazyLoadHints.value.push(payload)
      }
    }
    catch {
      console.warn('[hints] Ignoring malformed hints:lazy-load:report event', event.data)
      return
    }
  }

  const lazyLoadClearedHandler = (event: MessageEvent) => {
    try {
      const clearedId = JSON.parse(event.data)
      lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== clearedId)
    }
    catch {
      return
    }
  }

  watch(nuxtApp.$sse.eventSource, (newEventSource, oldEventSource) => {
    if (newEventSource) {
      newEventSource.addEventListener('hints:lazy-load:report', lazyLoadReportHandler)
      newEventSource.addEventListener('hints:lazy-load:cleared', lazyLoadClearedHandler)
    }
    if (oldEventSource) {
      oldEventSource.removeEventListener('hints:lazy-load:report', lazyLoadReportHandler)
      oldEventSource.removeEventListener('hints:lazy-load:cleared', lazyLoadClearedHandler)
    }
  }, {
    immediate: true,
  })

  return {
    provide: {
      lazyLoadHints,
    },
  }
})
