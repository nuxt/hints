import type { VNode, Ref } from 'vue'
import type { LCPMetricWithAttribution, INPMetricWithAttribution, CLSMetricWithAttribution } from 'web-vitals/attribution'
import type { LocalHydrationMismatch } from './hydration/types'
import type { DirectImportInfo, LazyHydrationState } from './lazy-load/composables'
import type { Features } from './core/types'
import type { HintsClientFunctions } from './core/rpc-types'

declare global {
  var __nuxtHintsRpcBroadcast: HintsClientFunctions | undefined

  interface Window {
    __hints_TPC_start_time: number
    __hints_TPC_saveTime: (script: HTMLScriptElement, startTime?: number) => void
    __hints_html_validation?: import('./html-validate/types').HtmlValidateReport
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
        features: Features
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
      htmlValidateResult?: import('./html-validate/types').HtmlValidateReport
    }
  }
}

export {}
