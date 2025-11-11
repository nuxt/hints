<script setup lang="ts">
definePageMeta({
  title: 'Hydration',
})

const { hydration } = useHostHydration()
</script>

<template>
  <div
    grid
    gap-4
    p-4
  >
    <template v-if="hydration.length">
      <HydrationIssue
        v-for="issue in hydration"
        :issue="issue"
      />
    </template>
    <div
      v-else
      class="text-neutral-500 dark:text-neutral-400"
    >
      No hydration issues found
    </div>
  </div>
</template>
