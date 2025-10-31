<script setup lang="ts">
const { allMetrics } = useHostWebVitals()
const { hydration } = useHostHydration()

const hydrationCount = computed(() => hydration.length || 0)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
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

    <NuxtLink
      to="/hydration"
      class="block"
    >
      <n-card class="flex items-center justify-between p-4 hover:border-neutral-400 dark:hover:border-neutral-500">
        <div class="flex items-center gap-3 min-w-0">
          <Icon
            name="material-symbols:water-full"
            class="text-xl text-cyan-500"
          />
          <div class="min-w-0">
            <div class="text-sm font-medium truncate">
              Hydration
            </div>
            <div class="text-xs text-neutral-500">
              SSR vs client diffs
            </div>
          </div>
        </div>
        <n-tag
          v-if="hydrationCount"
          size="small"
          type="error"
          :bordered="false"
        >
          {{ hydrationCount }} issues
        </n-tag>
      </n-card>
    </NuxtLink>

    <NuxtLink
      to="/third-party-scripts"
      class="block"
    >
      <n-card class="p-4 flex items-center gap-3 hover:border-neutral-400 dark:hover:border-neutral-500">
        <Icon
          name="material-symbols:extension"
          class="text-xl text-violet-500"
        />
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">
            Third party scripts
          </div>
          <div class="text-xs text-neutral-500">
            Analyze third-party scripts speed.
          </div>
        </div>
      </n-card>
    </NuxtLink>
  </div>
</template>
