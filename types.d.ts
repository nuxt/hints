import type { ImagePerformanceData } from './src/runtime/plugins/performance/utils'

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances: ImagePerformanceData[]
    }
  }
}
