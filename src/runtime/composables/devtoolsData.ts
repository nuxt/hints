import type { ImagePerformanceIssueDetails } from '../plugins/performance/utils'
import { useNuxtApp } from '#app'

export type ImagePerformanceData = {
  componentLocation: string | undefined
  issues: ImagePerformanceIssueDetails[]
  element: HTMLImageElement
}

export function useHintIssues() {
  const nuxtApp = useNuxtApp()

  if (nuxtApp.__hintsPerformances) {
    return nuxtApp.__hintsPerformances
  }
  nuxtApp.__hintsPerformances = {
    imagePerformances: [],
  }

  return nuxtApp.__hintsPerformances
}
