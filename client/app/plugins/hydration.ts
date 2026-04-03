import type { HydrationMismatchPayload, HydrationMismatchResponse, LocalHydrationMismatch } from '../../../src/runtime/hydration/types'
import { defineNuxtPlugin, useHostNuxt, ref } from '#imports'
import { HYDRATION_ROUTE } from '../utils/routes'

export default defineNuxtPlugin(() => {
  if (import.meta.test || !useHintsFeature('hydration')) return

  const host = useHostNuxt()
  const nuxtApp = useNuxtApp()
  const hydrationMismatches = ref<(HydrationMismatchPayload | LocalHydrationMismatch)[]>([])

  hydrationMismatches.value = [...host.payload.__hints.hydration]

  $fetch<HydrationMismatchResponse>(new URL(HYDRATION_ROUTE, window.location.origin).href).then((data: { mismatches: HydrationMismatchPayload[] }) => {
    hydrationMismatches.value = [...hydrationMismatches.value, ...data.mismatches.filter(m => !hydrationMismatches.value.some(existing => existing.id === m.id))]
  })

  nuxtApp.hook('hints:rpc:hydration:mismatch', (mismatch) => {
    if (!hydrationMismatches.value.some(existing => existing.id === mismatch.id)) {
      hydrationMismatches.value.push(mismatch)
    }
  })

  nuxtApp.hook('hints:rpc:hydration:cleared', (clearedIds) => {
    hydrationMismatches.value = hydrationMismatches.value.filter(m => !clearedIds.includes(m.id))
  })

  return {
    provide: {
      hydrationMismatches,
    },
  }
})
