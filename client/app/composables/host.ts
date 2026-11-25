import { useDevtoolsHost } from './devtools'
import type { CLSMetricWithAttribution, INPMetricWithAttribution, LCPMetricWithAttribution } from 'web-vitals/attribution'
import { computed, onScopeDispose, ref } from 'vue'

export function useHostThirdPartyScripts() {
  const hostNuxt = useHostNuxt()

  return {
    scripts: hostNuxt.payload.__hints.thirdPartyScripts,
    isUsingNuxtScripts: Boolean(hostNuxt.$scripts),
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

export function useHostBaseURL() {
  return useHostNuxt().$config.app.baseURL
}

export function useHostNuxt() {
  const host = useDevtoolsHost().value

  if (!host?.nuxt) {
    throw new Error('`useHostNuxt` must be used when the devtools client is connected to a host app')
  }

  return host.nuxt
}
