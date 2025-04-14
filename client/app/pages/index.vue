<script setup lang="ts">
const { imagePerformances } = useHostPerformancesData()
</script>

<template>
  <div class="relative p-4 n-bg-base flex flex-col">
    <NButton
      n="xl"
      flex
      justify-between
      items-center
      to="/image-performance"
    >
      <span
        flex
        flex-col
        gap-2
      >
        Image performances
        <span
          v-if="imagePerformances.length"
          text-sm
        >
          {{ imagePerformances.length }} image have issues
        </span>
      </span>

      <Icon
        name="material-symbols:chevron-right-rounded"
        text-xl
      />
    </NButton>
  </div>
</template>
