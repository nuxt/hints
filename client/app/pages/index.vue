<script setup lang="ts">
const { imagePerformances, hydration } = useHostPerformancesData()
</script>

<template>
  <div class="relative p-4 n-bg-base flex flex-col gap-4">
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
    <NButton
      n="xl"
      flex
      justify-between
      items-center
      to="/hydration"
    >
      <span
        flex
        flex-col
        gap-2
      >
        Hydration issues
        <span
          v-if="hydration.length"
          text-sm
        >
          {{ hydration.length }} hydration issues
        </span>
      </span>

      <Icon
        name="material-symbols:chevron-right-rounded"
        text-xl
      />
    </NButton>
  </div>
</template>
