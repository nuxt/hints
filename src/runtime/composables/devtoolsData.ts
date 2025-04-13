import { reactive, shallowReactive } from 'vue'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import type { ImagePerformanceIssueDetails } from '../plugins/performance/plugin.client'
import { createGetWithDefault, MapWithDefault } from '../utils/MapWithDefault'
import { useNuxtApp } from '#app'

declare global {
  interface Window {
    __NUXT_PERFORMANCE_ISSUES__: {
      imagePerformances: { get: (key: Element) => ImagePerformanceIssueDetails[] }
    }
  }
}

declare module '#app' {
  interface NuxtApp {
    __hintsPerformances: {
      imagePerformances: { get: (key: Element) => ImagePerformanceIssueDetails[] }
    }
  }
}

export function hintIssues() {
  const nuxtApp = useNuxtApp()

  if (nuxtApp.__hintsPerformances) {
    return nuxtApp.__hintsPerformances
  }
  nuxtApp.__hintsPerformances = {
    imagePerformances: createGetWithDefault<Element, ImagePerformanceIssueDetails[]>(() => []),
  }
  return nuxtApp.__hintsPerformances
}
