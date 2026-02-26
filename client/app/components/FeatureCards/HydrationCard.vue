<script setup lang="ts">
const hydration = useNuxtApp().$hydrationMismatches
const hydrationCount = computed(() => hydration.value.length)
</script>

<template>
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
      <n-tip
        v-if="hydrationCount"
        size="small"
        type="error"
        :bordered="false"
      >
        {{ hydrationCount }} issues
      </n-tip>
    </n-card>
  </NuxtLink>
</template>
