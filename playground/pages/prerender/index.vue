<template>
  <div class="test">
    Hello. Could this page be prerendered ? {{ shouldPrerender }}
  </div>
</template>

<script setup lang="ts">
import { useNuxtApp, useState } from '#app'
import { onMounted } from 'vue'

const shouldPrerender = useState('shouldPrerender', () => true)

if (import.meta.server) {
  // ssr context access will be detected by the prerender plugin
  console.log(useNuxtApp().ssrContext?.event.context.shouldPrerender)
}

onMounted(() => {
  // @ts-expect-error for demo purposes
  if (typeof window.__NUXT_HINTS_SHOULD_PRERENDER__ !== 'undefined') {
  // @ts-expect-error for demo purposes
    shouldPrerender.value = window.__NUXT_HINTS_SHOULD_PRERENDER__
  }
})
</script>
