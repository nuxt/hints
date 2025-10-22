<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function longInp() {
  const start = performance.now()
  while (performance.now() - start < 500) {
    // busy loop for ~500ms
  }
  count.value++
}
</script>

<template>
  <div>
    <button @click="count++">
      Count: {{ count }}
    </button>

    <button @click="longInp">
      Simulate Long INP
    </button>
  </div>
</template>
