import type { HydrationMismatchPayload, HydrationMismatchResponse, LocalHydrationMismatch } from '../../../src/runtime/hydration/types'
import { defineNuxtPlugin, useHostNuxt, ref } from '#imports'
import { HYDRATION_ROUTE, HYDRATION_SSE_ROUTE } from '../../../src/runtime/hydration/utils'

export default defineNuxtPlugin(() => {
  const host = useHostNuxt()

  const hydrationMismatches = ref<(HydrationMismatchPayload | LocalHydrationMismatch)[]>([])

  hydrationMismatches.value = [...host.__hints.hydration]

  $fetch<HydrationMismatchResponse>(new URL(HYDRATION_ROUTE, window.location.origin).href).then((data: { mismatches: HydrationMismatchPayload[] }) => {
    hydrationMismatches.value = [...hydrationMismatches.value, ...data.mismatches.filter(m => !hydrationMismatches.value.some(existing => existing.id === m.id))]
  })

  const eventSource = new EventSource(new URL(HYDRATION_SSE_ROUTE, window.location.origin).href)
  eventSource.addEventListener('hints:hydration:mismatch', (event) => {
    const mismatch: HydrationMismatchPayload = JSON.parse(event.data)
    if (!hydrationMismatches.value.some(existing => existing.id === mismatch.id)) {
      hydrationMismatches.value.push(mismatch)
    }
  })
  eventSource.addEventListener('hints:hydration:cleared', (event) => {
    const clearedIds: string[] = JSON.parse(event.data)
    hydrationMismatches.value = hydrationMismatches.value.filter(m => !clearedIds.includes(m.id))
  })

  return {
    provide: {
      hydrationMismatches,
    },
  }
})
