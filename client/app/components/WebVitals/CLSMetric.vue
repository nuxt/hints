<script setup lang="ts">
import type { CLSMetricWithAttribution } from 'web-vitals'

const props = defineProps<{
  metric: CLSMetricWithAttribution
}>()

const element = computed(() => props.metric.entries[0]?.sources?.[0]?.node as HTMLElement | undefined)

const formatScore = (score: number) => score.toFixed(4)
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
          >CLS</span>
          <span
            font-mono
            text-xl
          >{{ formatScore(metric.value) }}</span>
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

      <!-- Largest Shift Info -->
      <ElementInfo
        v-if="metric.attribution.largestShiftTarget"
        label="Largest Shift Element"
        :target="metric.attribution.largestShiftTarget"
        :element="element"
      />

      <!-- Shift Details -->
      <div
        v-if="metric.attribution.largestShiftValue !== undefined"
        grid
        grid-cols-2
        gap-2
      >
        <div
          border
          border-neutral-200
          dark:border-neutral-800
          rounded
          p-2
        >
          <div
            text-xs
            text-neutral-500
            dark:text-neutral-400
          >
            Largest Shift Score
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatScore(metric.attribution.largestShiftValue) }}
          </div>
        </div>

        <div
          v-if="metric.attribution.largestShiftTime !== undefined"
          border
          border-neutral-200
          dark:border-neutral-800
          rounded
          p-2
        >
          <div
            text-xs
            text-neutral-500
            dark:text-neutral-400
          >
            Shift Time
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.largestShiftTime) }}
          </div>
        </div>
      </div>

      <!-- Layout Shift Entries -->
      <div
        v-if="metric.entries.length"
        border
        rounded
        p-2
        class="bg-blue-50 dark:bg-blue-800/10 border-blue-200 dark:border-blue-800"
      >
        <div
          text-xs
          text-blue-700
          dark:text-blue-400
          font-semibold
        >
          Total Layout Shifts: {{ metric.entries.length }}
        </div>
      </div>

      <!-- Load State & ID -->
      <div
        flex
        items-center
        justify-between
        text-xs
        text-neutral-500
        dark:text-neutral-400
      >
        <span v-if="metric.attribution.loadState">Load State: {{ metric.attribution.loadState }}</span>
        <span>ID: {{ metric.id }}</span>
      </div>
    </div>
  </n-card>
</template>
