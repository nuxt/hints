<template>
  <div>
    hello third-party scripts
  </div>
</template>

<script lang="ts" setup>
import { useHead } from '#imports'

useHead({
  script: [
    {
      src: 'https://cdn.jsdelivr.net/npm/confetti-js@0.0.18/dist/index.min.js',
    },
  ],
})
</script>
