import type { ComponentInternalInstance, VNode, Ref } from 'vue'
import type { ImagePerformanceData } from './src/runtime/plugins/performance/utils'

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances: Ref<ImagePerformanceData[]>
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
