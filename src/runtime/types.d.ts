import type { VNode, Ref } from 'vue'
import type { LCPMetricWithAttribution, INPMetricWithAttribution, CLSMetricWithAttribution } from 'web-vitals/attribution'
import type { HydrationMismatchPayload, LocalHydrationMismatch } from './hydration/types'
import type { DirectImportInfo, LazyHydrationState } from './lazy-load/composables'
import type { FeaturesName, FeatureFlags } from './core/types'

declare global {
  interface Window {
    __hints_TPC_start_time: number
    __hints_TPC_saveTime: (script: HTMLScriptElement, startTime?: number) => void
    __hints_html_validation?: import('./html-validator/types').HtmlValidateReport
  }
  interface HTMLScriptElement {
    __hints_TPC_start_time?: number
    __hints_TPC_end_time?: number
    requestTime?: number
    downloadTime?: number
    totalNetworkTime?: number
    parseExecuteTime?: number
    loaded?: boolean
  }
  interface Element {
    __vnode?: VNode
  }
}

declare module '#app' {
  interface RuntimeNuxtHooks {
    'hints:scripts:added': (script: HTMLScriptElement) => void
    'hints:scripts:loaded': (script: HTMLScriptElement) => void

    'hints:webvitals:sync': (webvitals: NuxtPayload['__hints']['webvitals']) => void
    'hints:webvitals:lcp': (metric: LCPMetricWithAttribution) => void
    'hints:webvitals:inp': (metric: INPMetricWithAttribution) => void
    'hints:webvitals:cls': (metric: CLSMetricWithAttribution) => void
  }

  interface NuxtApp {
    __tracerOverlay: typeof import('vite-plugin-vue-tracer/client/overlay')
    __tracerRecord: typeof import('vite-plugin-vue-tracer/client/record')
    hints: {
      config: {
        features: Record<FeaturesName, FeatureFlags | boolean>
      }
    }
  }

  interface NuxtPayload {
    __hints: {
      lazyHydrationState?: LazyHydrationState
      hydration: LocalHydrationMismatch[]
      lazyComponents: DirectImportInfo[]
      webvitals: {
        lcp: Ref<LCPMetricWithAttribution[]>
        inp: Ref<INPMetricWithAttribution[]>
        cls: Ref<CLSMetricWithAttribution[]>
      }
      thirdPartyScripts: Ref<{
        element: HTMLScriptElement
        loaded: boolean
      }[]>
      htmlValidateResult?: import('./html-validator/types').HtmlValidateReport
    }
  }
}

declare module 'nitropack' {
  interface NitroRuntimeHooks {
    // Core hints hooks
    'hints:sse:setup': (context: import('./core/server/types').HintsSseContext) => void

    // html-validate hooks
    'hints:html-validate:report': (report: import('./html-validator/types').HtmlValidateReport) => void
    'hints:html-validate:deleted': (id: string) => void

    // Hydration hooks
    'hints:hydration:mismatch': (payload: HydrationMismatchPayload) => void
    'hints:hydration:cleared': (payload: { id: string[] }) => void

    // Lazy-load hooks
    'hints:lazy-load:report': (payload: import('./lazy-load/schema').ComponentLazyLoadData) => void
    'hints:lazy-load:cleared': (payload: { id: string }) => void
  }
}

export {}
