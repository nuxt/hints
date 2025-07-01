<template>
  <NCard
    p-4
    relative
  >
    <div
      v-if="element"
      class="absolute top-2 right-2 space-x-2"
    >
      <button
        title="show element in tracer"
        @click="onToggleTracer(element)"
      >
        <Icon name="material-symbols:target" />
      </button>

      <button
        title="open in editor"
        @click="openElementSourceComponent(element)"
      >
        <Icon name="material-symbols:file-open-outline" />
      </button>
    </div>

    <slot />
  </NCard>
</template>

<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

defineProps<{
  element?: HTMLElement
}>()

const client = useDevtoolsClient()

const controller = new AbortController()
const signal = controller.signal

function onToggleTracer(el?: Element) {
  if (!el) {
    return
  }

  const { isVisible } = client.value!.host.nuxt.__tracerOverlay.state
  if (isVisible) {
    client.value!.host.nuxt.__tracerOverlay.state.isVisible = false
  }

  const traceInfo = findClosestTraceInfo(el)

  if (!traceInfo) {
    return
  }

  client.value!.host.nuxt.__tracerOverlay.state.main = traceInfo
  client.value!.host.nuxt.__tracerOverlay.state.isVisible = true
  el.scrollIntoView({
    behavior: 'smooth',
  })

  window.addEventListener('keydown', onKeyDown, { once: true, signal })
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    client.value!.host.nuxt.__tracerOverlay.state.isVisible = false
  }
}

onUnmounted(() => {
  controller.abort()
})
</script>
