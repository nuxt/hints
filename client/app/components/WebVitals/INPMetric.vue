<script setup lang="ts">
import type { INPMetricWithAttribution } from 'web-vitals'

const props = defineProps<{
  metric: INPMetricWithAttribution
}>()

const element = computed(() => props.metric.entries[0]?.target as HTMLElement | undefined)

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
          >INP</span>
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

      <!-- Interaction Info -->
      <ElementInfo
        label="Interaction Target"
        :target="metric.attribution.interactionTarget"
        :element="element"
      >
        <template #header-right>
          <span
            text-xs
            font-semibold
            text-blue-600
            uppercase
          >
            {{ metric.attribution.interactionType }}
          </span>
        </template>
      </ElementInfo>

      <!-- Timing Breakdown -->
      <div
        grid
        grid-cols-3
        gap-2
      >
        <div
          border
          border-neutral-200
          rounded
          p-2
        >
          <div
            text-xs
            text-neutral-500
          >
            Input Delay
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.inputDelay) }}
          </div>
        </div>

        <div
          border
          border-neutral-200
          rounded
          p-2
        >
          <div
            text-xs
            text-neutral-500
          >
            Processing
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.processingDuration) }}
          </div>
        </div>

        <div
          border
          border-neutral-200
          rounded
          p-2
        >
          <div
            text-xs
            text-neutral-500
          >
            Presentation
          </div>
          <div
            font-mono
            text-sm
            font-semibold
          >
            {{ formatTime(metric.attribution.presentationDelay) }}
          </div>
        </div>
      </div>

      <!-- Long Animation Frames Info -->
      <div
        v-if="metric.attribution.longAnimationFrameEntries?.length"
        border
        border-orange-200
        rounded
        p-2
        bg-orange-50
      >
        <div
          text-xs
          text-orange-700
          font-semibold
          mb-1
        >
          Long Animation Frames Detected
        </div>
        <div
          text-xs
          text-neutral-600
        >
          {{ metric.attribution.longAnimationFrameEntries.length }} frame(s)
        </div>
        <div
          v-if="metric.attribution.longestScript"
          mt-2
          text-xs
        >
          <div
            text-neutral-500
            mb-1
          >
            Longest Script ({{ metric.attribution.longestScript.subpart }})
          </div>
          <div
            font-mono
            text-xs
          >
            {{ formatTime(metric.attribution.longestScript.intersectingDuration) }}
          </div>
        </div>
      </div>

      <!-- Duration Breakdown (if available) -->
      <div
        v-if="metric.attribution.totalScriptDuration !== undefined"
        grid
        grid-cols-2
        gap-2
        text-xs
      >
        <div>
          <span
            text-neutral-500
          >Total Script:</span>
          <span
            font-mono
            ml-1
          >{{ formatTime(metric.attribution.totalScriptDuration) }}</span>
        </div>
        <div>
          <span
            text-neutral-500
          >Style & Layout:</span>
          <span
            font-mono
            ml-1
          >{{ formatTime(metric.attribution.totalStyleAndLayoutDuration || 0) }}</span>
        </div>
        <div v-if="metric.attribution.totalPaintDuration !== undefined">
          <span
            text-neutral-500
          >Paint:</span>
          <span
            font-mono
            ml-1
          >{{ formatTime(metric.attribution.totalPaintDuration) }}</span>
        </div>
        <div v-if="metric.attribution.totalUnattributedDuration !== undefined">
          <span
            text-neutral-500
          >Unattributed:</span>
          <span
            font-mono
            ml-1
          >{{ formatTime(metric.attribution.totalUnattributedDuration) }}</span>
        </div>
      </div>

      <!-- Load State & ID -->
      <div
        flex
        items-center
        justify-between
        text-xs
        text-neutral-400
      >
        <span>Load State: {{ metric.attribution.loadState }}</span>
        <span>ID: {{ metric.id }}</span>
      </div>
    </div>
  </n-card>
</template>
