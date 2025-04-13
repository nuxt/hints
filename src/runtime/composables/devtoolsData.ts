  import type { ImagePerformanceIssueDetails } from '../plugins/performance/plugin.client'
 import { useNuxtApp } from '#app'

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances:  {
        componentLocation: string | undefined
        issues: ImagePerformanceIssueDetails[]
        element: HTMLElement
      }[]
    }
  }
}

export function useHintIssues() {
  const nuxtApp = useNuxtApp()

  if (nuxtApp.__hintsPerformances) {
    return nuxtApp.__hintsPerformances
  }
  nuxtApp.__hintsPerformances = {
    imagePerformances: []
  }

  return nuxtApp.__hintsPerformances
}
