import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import type { CLSMetricWithAttribution, INPMetricWithAttribution, LCPMetricWithAttribution } from 'web-vitals/attribution'
import { computed, onScopeDispose, ref } from 'vue'

export function useHostThirdPartyScripts() {
  const client = useDevtoolsClient().value

  if (!client) {
    throw new Error('`useHostThirdPartyScripts` must be used when the devtools client is connected')
  }

  return {
    scripts: client.host.nuxt.payload.__hints.thirdPartyScripts,
    isUsingNuxtScripts: Boolean(client.host.nuxt.$scripts),
  }
}

export function useHostWebVitals() {
  const lcp = ref<LCPMetricWithAttribution[]>([])
  const inp = ref<INPMetricWithAttribution[]>([])
  const cls = ref<CLSMetricWithAttribution[]>([])
  const hostNuxt = useHostNuxt()

  hostNuxt.callHook('hints:webvitals:sync', { lcp, inp, cls })

  const unsubArray = [
    hostNuxt.hook('hints:webvitals:cls', (metric: CLSMetricWithAttribution) => {
      cls.value.push(metric)
    }),
    hostNuxt.hook('hints:webvitals:lcp', (metric: LCPMetricWithAttribution) => {
      lcp.value.push(metric)
    }),
    hostNuxt.hook('hints:webvitals:inp', (metric: INPMetricWithAttribution) => {
      inp.value.push(metric)
    }),
  ]

  onScopeDispose(() => {
    unsubArray.forEach(unsub => unsub())
  })

  const allMetrics = computed(() => [...lcp.value, ...inp.value, ...cls.value])

  return { lcp, inp, cls, allMetrics }
}

export function useHostHydration() {
  const host = useHostNuxt()

  return { hydration: host.payload.__hints.hydration }
}

export function useHostNuxt() {
  const client = useDevtoolsClient().value

  if (!client) {
    throw new Error('`useHostNuxt` must be used when the devtools client is connected')
  }

  return client.host.nuxt
}
