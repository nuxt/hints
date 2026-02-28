<script setup lang="ts">
const lazyLoad = useNuxtApp().$lazyLoadHints
const lazyLoadCount = computed(() =>
  lazyLoad.value.reduce(
    (sum: number, entry: { state: { directImports: { rendered: boolean }[] } }) => sum + entry.state.directImports.filter((i: { rendered: boolean }) => !i.rendered).length,
    0,
  ),
)
</script>

<template>
  <NuxtLink
    to="/component-lazy-load"
    class="block"
  >
    <n-card class="flex items-center justify-between p-4 hover:border-neutral-400 dark:hover:border-neutral-500">
      <div class="flex items-center gap-3 min-w-0">
        <Icon
          name="material-symbols:speed"
          class="text-xl text-amber-500"
        />
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">
            Lazy Load
          </div>
          <div class="text-xs text-neutral-500">
            Components to lazy-load
          </div>
        </div>
      </div>
      <n-tip
        v-if="lazyLoadCount"
        size="small"
        type="warning"
        :bordered="false"
      >
        {{ lazyLoadCount }} suggestions
      </n-tip>
    </n-card>
  </NuxtLink>
</template>
