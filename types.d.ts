import type { ImagePerformanceData } from './src/runtime/plugins/performance/utils'
import type { ComponentInternalInstance, VNode } from "vue"

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances: ImagePerformanceData[]
    }
    __tracerOverlay: typeof import('vite-plugin-vue-tracer/client/overlay')
    __tracerRecord: typeof import('vite-plugin-vue-tracer/client/record')
    __hintsHydration: { instance: ComponentInternalInstance, vnode: VNode, htmlPreHydration: string | undefined, htmlPostHydration: string | undefined }[]
  }
}

declare global {
  interface Element {
    __vnode?: VNode
  }
}