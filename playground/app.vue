<script setup lang="ts">
import { onMounted, ref } from 'vue'

const shouldMoveImage = ref(false)

onMounted(() => {
  setTimeout(() => {
    shouldMoveImage.value = true
  }, 1000)
})

const isServer = import.meta.server ? 1 : 0
</script>

<template>
  <div class="test">
    <img
      :style="{ margin: shouldMoveImage ? '200px' : '0px' }"
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Logo_Nuxt_Black_%282023%29.svg/2560px-Logo_Nuxt_Black_%282023%29.svg.png"
    >
    <div>
      <p>isServer: {{ isServer }}</p>
    </div>
  </div>
</template>
