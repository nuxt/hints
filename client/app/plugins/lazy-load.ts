import type { ComponentLazyLoadData } from '../../../src/runtime/lazy-load/schema'
import { defineNuxtPlugin } from '#imports'
import { LAZY_LOAD_ROUTE } from '../../../src/runtime/lazy-load/utils'

export default defineNuxtPlugin(() => {
  const eventSource = useHintsSSE()

  const { data: lazyLoadHints } = useLazyFetch<ComponentLazyLoadData[]>(new URL(LAZY_LOAD_ROUTE, window.location.origin).href, {
    default: () => [],
    deep: true,
  })

  eventSource.value.addEventListener('hints:lazy-load:report', (event) => {
    const payload: ComponentLazyLoadData = JSON.parse(event.data)
    if (!lazyLoadHints.value.some(existing => existing.id === payload.id)) {
      lazyLoadHints.value.push(payload)
    }
  })
  eventSource.value.addEventListener('hints:lazy-load:cleared', (event) => {
    const clearedId: string = JSON.parse(event.data)
    lazyLoadHints.value = lazyLoadHints.value.filter(entry => entry.id !== clearedId)
  })

  return {
    provide: {
      lazyLoadHints,
    },
  }
})
