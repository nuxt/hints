import type { HydrationMismatchPayload, HydrationMismatchResponse, LocalHydrationMismatch } from '../../../src/runtime/hydration/types'
import { defineNuxtPlugin, useHostNuxt, ref } from '#imports'
import { HYDRATION_ROUTE } from '../utils/routes'

export default defineNuxtPlugin(() => {
  const host = useHostNuxt()
  const nuxtApp = useNuxtApp()
  const hydrationMismatches = ref<(HydrationMismatchPayload | LocalHydrationMismatch)[]>([])

  hydrationMismatches.value = [...host.payload.__hints.hydration]

  $fetch<HydrationMismatchResponse>(new URL(HYDRATION_ROUTE, window.location.origin).href).then((data: { mismatches: HydrationMismatchPayload[] }) => {
    hydrationMismatches.value = [...hydrationMismatches.value, ...data.mismatches.filter(m => !hydrationMismatches.value.some(existing => existing.id === m.id))]
  })

  const hydrationMismatchHandler = (event: MessageEvent) => {
    const mismatch: HydrationMismatchPayload = JSON.parse(event.data)
    if (!hydrationMismatches.value.some(existing => existing.id === mismatch.id)) {
      hydrationMismatches.value.push(mismatch)
    }
  }

  const hydrationClearedHandler = (event: MessageEvent) => {
    const clearedIds: string[] = JSON.parse(event.data)
    hydrationMismatches.value = hydrationMismatches.value.filter(m => !clearedIds.includes(m.id))
  }

  watch(nuxtApp.$sse.eventSource, (newEventSource, oldEventSource) => {
    if (newEventSource) {
      newEventSource.addEventListener('hints:hydration:mismatch', hydrationMismatchHandler)
      newEventSource.addEventListener('hints:hydration:cleared', hydrationClearedHandler)
    }
    if (oldEventSource) {
      oldEventSource.removeEventListener('hints:hydration:mismatch', hydrationMismatchHandler)
      oldEventSource.removeEventListener('hints:hydration:cleared', hydrationClearedHandler)
    }
  }, {
    immediate: true,
  })

  return {
    provide: {
      hydrationMismatches,
    },
  }
})
