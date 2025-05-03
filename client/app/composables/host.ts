import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

export function useHostPerformancesData() {
  const client = useDevtoolsClient().value

  if (!client) {
    throw new Error('`useHostPerformancesData` must be used when the devtools client is connected')
  }

  return {
    imagePerformances: client.host.nuxt.__hintsPerformances.imagePerformances,
  }
}
