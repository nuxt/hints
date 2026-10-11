import type { Ref } from 'vue'
import type { HydrationMismatchPayload, LocalHydrationMismatch } from '../../src/runtime/hydration/types'
import type { ComponentLazyLoadData } from '../../src/runtime/lazy-load/schema'
import type { HtmlValidateReport } from '../../src/runtime/html-validate/types'

declare module '#app' {
  interface NuxtApp {
    $hydrationMismatches: Ref<(HydrationMismatchPayload | LocalHydrationMismatch)[]>
    $lazyLoadHints: Ref<ComponentLazyLoadData[]>
    $htmlValidateReports: Ref<HtmlValidateReport[]>
  }
}

export {}
