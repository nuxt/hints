<script setup lang="ts">
import type { LCPMetricWithAttribution } from 'web-vitals'

const props = defineProps<{
  metric: LCPMetricWithAttribution
}>()

const element = computed(() => props.metric.entries[0]?.element as HTMLElement | undefined)

const formatTime = (time: number) => `${time.toFixed(0)}ms`
</script>

<template>
  <n-card p-2>
    <div
      flex
      flex-col
      gap-3
    >
      <!-- Header -->
      <div
        flex
        items-center
        justify-between
      >
        <div
          flex
          items-center
          gap-2
        >
          <span
            font-bold
            text-lg
          >LCP</span>
          <span
            font-mono
            text-xl
          >{{ formatTime(metric.value) }}</span>
        </div>
        <span
          :class="{
            'text-green-500': metric.rating === 'good',
            'text-yellow-500': metric.rating === 'needs-improvement',
            'text-red-500': metric.rating === 'poor',
          }"
          font-semibold
          text-sm
          uppercase
        >
          {{ metric.rating }}
        </span>
      </div>

      <!-- Element Info -->
      <ElementInfo
        v-if="metric.attribution.target"
        label="LCP Element"
        :target="metric.attribution.target"
        :element="element"
      >
        <template #sub>
          <div
            v-if="metric.attribution.url"
            text-xs
            text-gray-600
            mt-1
            break-all
          >
            {{ metric.attribution.url }}
          </div>
        </template>
      </ElementInfo>

      <!-- Timing Breakdown -->
      <div
        grid
        grid-cols-2
        gap-2
      >
        <div
          border
          border-gray-200
          rounded
          p-2
        >
          <div
            text-xs
            text-gray-500
          >
            Time to First Byte
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.timeToFirstByte) }}
          </div>
        </div>

        <div
          border
          border-gray-200
          rounded
          p-2
        >
          <div
            text-xs
            text-gray-500
          >
            Resource Load Delay
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.resourceLoadDelay) }}
          </div>
        </div>

        <div
          border
          border-gray-200
          rounded
          p-2
        >
          <div
            text-xs
            text-gray-500
          >
            Resource Load Duration
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.resourceLoadDuration) }}
          </div>
        </div>

        <div
          border
          border-gray-200
          rounded
          p-2
        >
          <div
            text-xs
            text-gray-500
          >
            Element Render Delay
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.elementRenderDelay) }}
          </div>
        </div>
      </div>

      <!-- ID -->
      <div
        text-xs
        text-gray-400
      >
        ID: {{ metric.id }}
      </div>
    </div>
  </n-card>
</template>
