import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { computed } from 'vue'

export function useHostPerformancesData() {
  const client = useDevtoolsClient().value

  if (!client) {
    throw new Error('`useHostPerformancesData` must be used when the devtools client is connected')
  }

  return {
    computedRaw: computed(() => {
      return client.host.nuxt.__hintsPerformances
    }),
    imagePerformances: computed(() => {
      return client.host.nuxt.__hintsPerformances.imagePerformances
    }),
  }
}
