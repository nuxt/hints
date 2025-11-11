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

const { lcp, inp, cls } = useHostWebVitals()

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
    <header class="overflow-x-auto grid gap-4 grid-cols-4">
      <!-- All metrics button -->
      <n-card
        class="p-2 flex flex-col justify-center gap-1 cursor-pointer"
        :class="[!selectedHeader ? 'border-neutral-500 dark:border-neutral-400 bg-neutral-50 dark:bg-neutral-800' : 'hover:border-neutral-400 dark:hover:border-neutral-500']"
        @click="selectedHeader = undefined"
      >
        <span class="text-lg font-bold">All</span>
        <span class="text-xs text-neutral-700 dark:text-neutral-300">Show all issues</span>
      </n-card>
      <n-card
        v-for="header in headers"
        class="p-2 gap-1 flex flex-col justify-center cursor-pointer"
        :class="[selectedHeader === header.key ? 'border-neutral-500 dark:border-neutral-400 bg-neutral-50 dark:bg-neutral-800' : 'hover:border-neutral-400 dark:hover:border-neutral-500']"
        @click="selectedHeader = selectedHeader === header.key ? undefined : header.key"
      >
        <span class="text-lg font-bold">{{ header.title }}</span>
        <span class="text-xs text-neutral-700 dark:text-neutral-300">{{ header.description }}</span>
        <a
          :href="header.articleLink"
          target="_blank"
          class="flex items-center gap-0.5 truncate max-w-full text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
          rel="noopener noreferrer"
          text-sm
        >
          {{ header.articleLink }}
          <icon name="lucide:arrow-up-right" />
        </a>
      </n-card>
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
        text-neutral-500
      >
        No performance issues detected. {{ selectedHeader ? selectedHeader?.toUpperCase() : 'All' }} metrics are good! 🎉
      </div>
    </main>
  </div>
</template>
