<script setup lang="ts">
 import { useHostPerformancesData } from '../composables/host';

const { imagePerformances } = useHostPerformancesData()
</script>

<template>
  <div class="relative n-bg-base flex flex-col h-screen p-4">
    <NButton class="text-left">
      <span class="text-md">
        Image Performances
      </span>
    </NButton>
  </div>
</template>
