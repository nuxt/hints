<template>
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
</template>
