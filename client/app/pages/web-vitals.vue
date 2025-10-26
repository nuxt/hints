<script setup lang="ts">
import type { LCPMetricWithAttribution, INPMetricWithAttribution, CLSMetricWithAttribution } from 'web-vitals'
import WebVitalsLCPMetric from '../components/WebVitals/LCPMetric.vue'
import WebVitalsINPMetric from '../components/WebVitals/INPMetric.vue'
import WebVitalsCLSMetric from '../components/WebVitals/CLSMetric.vue'

definePageMeta({
  title: 'Web Vitals',
})

const headers = [
  { title: 'LCP', key: 'lcp', articleLink: 'https://web.dev/articles/lcp', description: 'Largest Contentful Paint' },
  { title: 'INP', key: 'inp', articleLink: 'https://web.dev/articles/inp', description: 'Interaction to Next Paint' },
  { title: 'CLS', key: 'cls', articleLink: 'https://web.dev/articles/cls', description: 'Cumulative Layout Shift' },
] as const

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

onBeforeUnmount(() => {
  unsubArray.forEach(unsub => unsub())
})

const selectedHeader = ref<typeof headers[number]['key']>()

type AllItem
  = { type: 'lcp', metric: LCPMetricWithAttribution }
    | { type: 'inp', metric: INPMetricWithAttribution }
    | { type: 'cls', metric: CLSMetricWithAttribution }

const displayItems = computed<AllItem[]>(() => {
  if (selectedHeader.value === 'lcp') {
    return (lcp.value).map(m => ({ type: 'lcp', metric: m })) as AllItem[]
  }
  if (selectedHeader.value === 'inp') {
    return (inp.value).map(m => ({ type: 'inp', metric: m })) as AllItem[]
  }
  if (selectedHeader.value === 'cls') {
    return (cls.value).map(m => ({ type: 'cls', metric: m })) as AllItem[]
  }
  return [
    ...((lcp.value).map(m => ({ type: 'lcp', metric: m })) as AllItem[]),
    ...((inp.value).map(m => ({ type: 'inp', metric: m })) as AllItem[]),
    ...((cls.value).map(m => ({ type: 'cls', metric: m })) as AllItem[]),
  ]
})
</script>

<template>
  <div
    p-4
    grid
    gap-4
  >
    <header class="overflow-x-auto flex gap-4 grid-cols-4">
      <!-- All metrics button -->
      <n-button
        p-2
        hoverable
        @click="selectedHeader = undefined"
      >
        <div
          flex
          flex-col
          gap-2
        >
          <span
            font-bold
            text-lg
          >
            All
          </span>
          <p
            text-xs
            text-gray-500
          >
            Show all issues
          </p>
        </div>
      </n-button>
      <n-button
        v-for="header in headers"
        p-2
        hoverable
        @click="selectedHeader = selectedHeader === header.key ? undefined : header.key"
      >
        <div
          flex
          flex-col
          gap-2
        >
          <span
            font-bold
            text-lg
          >
            {{ header.title }}
          </span>
          <span
            text-xs
            text-gray-500
          >{{ header.description }}</span>
          <p>
            <span>Read more at</span>
            <a
              :href="header.articleLink"
              target="_blank"
              class="flex items-center gap-1 truncate max-w-full"
              rel="noopener noreferrer"
              text-sm
            >
              {{ header.articleLink }}
              <icon name="akar-icons:link-out" />
            </a>
          </p>
        </div>
      </n-button>
    </header>

    <main
      grid
      gap-3
    >
      <template v-if="displayItems.length">
        <template v-for="item in displayItems">
          <WebVitalsCLSMetric
            v-if="item.type === 'cls'"
            :metric="item.metric"
          />
          <WebVitalsLCPMetric
            v-else-if="item.type === 'lcp'"
            :metric="item.metric"
          />
          <WebVitalsINPMetric
            v-else-if="item.type === 'inp'"
            :metric="item.metric"
          />
        </template>
      </template>
      <div
        v-else
        text-center
        py-8
        text-gray-500
      >
        No performance issues detected. All metrics are good! 🎉
      </div>
    </main>
  </div>
</template>
