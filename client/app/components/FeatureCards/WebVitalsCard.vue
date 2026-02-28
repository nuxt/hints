<script setup lang="ts">
const { allMetrics } = useHostWebVitals()
</script>

<template>
  <NuxtLink
    to="/web-vitals"
    class="block"
  >
    <n-card
      class="flex items-center justify-between p-4 hover:border-neutral-400 dark:hover:border-neutral-500"
    >
      <div class="flex items-center gap-3 min-w-0">
        <Icon
          name="material-symbols:monitoring"
          class="text-xl text-blue-500"
        />
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">
            Web Vitals
          </div>
          <div class="text-xs text-neutral-500">
            LCP / INP / CLS
          </div>
        </div>
      </div>
      <n-badge
        v-if="allMetrics.length"
      >
        {{ allMetrics.length }} issues
      </n-badge>
    </n-card>
  </NuxtLink>
</template>
