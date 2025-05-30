import type { ImagePerformanceIssueDetails } from '../plugins/performance/utils'
import { useNuxtApp } from '#app'
import { ref } from 'vue'

export type ImagePerformanceData = {
  componentLocation: string | undefined
  issues: ImagePerformanceIssueDetails[]
  element: HTMLImageElement | HTMLElement
}

export function useHintIssues() {
  const nuxtApp = useNuxtApp()

  if (nuxtApp.__hintsPerformances) {
    return nuxtApp.__hintsPerformances
  }
  nuxtApp.__hintsPerformances = {
    imagePerformances: ref([]),
  }

  return nuxtApp.__hintsPerformances
}
