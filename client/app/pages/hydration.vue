<script setup lang="ts">
efinePageMeta({
  title: 'Hydration',
})

const { hydration } = useHostPerformancesData()
</script>

<template>
  <div
    grid
    gap-4
    p-4
  >
    <HydrationIssue
      v-for="issue in hydration"
      :issue="issue"
    />
  </div>
</template>
