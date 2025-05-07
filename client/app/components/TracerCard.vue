<template>
    <NCard p-4 relative @mouseenter="showElement(element)" @mouseleave="resetTracer">

        <button v-if="element" class="absolute top-2 right-2" title="open in editor"
            @click="openElementSourceComponent(element)">
            <Icon name="material-symbols:file-open-outline" />
        </button>

        <slot />
    </NCard>
</template>

<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client';

defineProps<{
    element?: HTMLElement
}>()

const client = useDevtoolsClient()

function showElement(el?: Element) {
  if (!el) {
    return
  }
   if (findClosestTraceInfo(el)) {
    client.value!.host.nuxt.__tracerOverlay.state.main = findClosestTraceInfo((el))
    client.value!.host.nuxt.__tracerOverlay.state.isVisible = true
    el.scrollIntoView({
      behavior: 'smooth',
    })
  }
}

function resetTracer(el?: HTMLElement) {
  if (!el) {
    return
  }
  client.value!.host.nuxt.__tracerOverlay.state.isVisible = false
}
</script>