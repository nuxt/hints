import type { ComponentInternalInstance, VNode, Ref } from 'vue'
import type { LCPMetricWithAttribution, INPMetricWithAttribution, CLSMetricWithAttribution } from 'web-vitals/attribution'

declare module '#app' {
  interface NuxtApp {
    __hints: {
      hydration: { instance: ComponentInternalInstance, vnode: VNode, htmlPreHydration: string | undefined, htmlPostHydration: string | undefined }[]
      webvitals: {
        lcp: Ref<LCPMetricWithAttribution[]>
        inp: Ref<INPMetricWithAttribution[]>
        cls: Ref<CLSMetricWithAttribution[]>
      }
    }
    __tracerOverlay: typeof import('vite-plugin-vue-tracer/client/overlay')
    __tracerRecord: typeof import('vite-plugin-vue-tracer/client/record')
  }
}

declare global {
  interface Element {
    __vnode?: VNode
  }
}
