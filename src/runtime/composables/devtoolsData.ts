import { reactive, shallowReactive } from 'vue'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import type { ImagePerformanceIssueDetails } from '../plugins/performance/plugin.client'
import { createGetWithDefault, MapWithDefault } from '../utils/MapWithDefault'
import { useNuxtApp } from '#app'

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances: { get: (key: Element) => ({
        componentLocation: string | undefined
        issues: ImagePerformanceIssueDetails[]
      }) }
    }
  }
}

export function useHintIssues() {
  const nuxtApp = useNuxtApp()

  if (nuxtApp.__hintsPerformances) {
    return nuxtApp.__hintsPerformances
  }
  nuxtApp.__hintsPerformances = {
    imagePerformances: createGetWithDefault<Element, {
      componentLocation: string | undefined
      issues: ImagePerformanceIssueDetails[]
    }>(() => ({
      componentLocation: undefined,
      issues: []
    })),
  }

  return nuxtApp.__hintsPerformances
}
