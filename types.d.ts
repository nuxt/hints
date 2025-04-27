import type { ImagePerformanceData } from './src/runtime/plugins/performance/utils'
import type { VNode } from 'vue' 

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances: ImagePerformanceData[]
    }
    __tracerOverlay: typeof import('vite-plugin-vue-tracer/client/record').default
  }
}

declare global {
  interface Element {
    __vnode?: VNode
  }
}