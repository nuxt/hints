import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

export function useHostPerformancesData() {
  const client = useDevtoolsClient().value

  if (!client) {
    throw new Error('`useHostPerformancesData` must be used when the devtools client is connected')
  }

  return {
    imagePerformances: client.host.nuxt.__hintsPerformances.imagePerformances,
    hydration: client.host.nuxt.__hintsHydration,
  }
}

export function useHostThirdPartyScripts() {
  const client = useDevtoolsClient().value

  if (!client) {
    throw new Error('`useHostThirdPartyScripts` must be used when the devtools client is connected')
  }

  return {
    scripts: client.host.nuxt.__hints_tpc,
    isUsingNuxtScripts: Boolean(client.host.nuxt.$scripts),
  }
}
