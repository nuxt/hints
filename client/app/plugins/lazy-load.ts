import type { ComponentLazyLoadData } from '../../../src/runtime/lazy-load/schema'
import { defineNuxtPlugin } from '#imports'
import { LAZY_LOAD_ROUTE } from '../../../src/runtime/lazy-load/utils'

export default defineNuxtPlugin(() => {
  const nuxtApp = useNuxtApp()

  const { data: lazyLoadHints } = useLazyFetch<ComponentLazyLoadData[]>(new URL(LAZY_LOAD_ROUTE, window.location.origin).href, {
    default: () => [],
    deep: true,
  })

  const lazyLoadReportHandler = (event: MessageEvent) => {
    const payload: ComponentLazyLoadData = JSON.parse(event.data)
    if (!lazyLoadHints.value.some(existing => existing.id === payload.id)) {
      lazyLoadHints.value.push(payload)
    }
  }

  const lazyLoadClearedHandler = (event: MessageEvent) => {
    const clearedId: string = JSON.parse(event.data)
    lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== clearedId)
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
  })

  return {
    provide: {
      lazyLoadHints,
    },
  }
})
