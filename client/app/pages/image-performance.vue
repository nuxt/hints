<script setup lang="ts">
import { events, state, findTraceFromElement } from 'vite-plugin-vue-tracer/client/overlay'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { ImagePerformanceIssueType } from '../../../src/runtime/plugins/performance/utils'

definePageMeta({
  title: 'Image Performances',
})
const client = useDevtoolsClient()
const { imagePerformances } = useHostPerformancesData()

function mouseOverElement(el?: HTMLElement) {
  if (!el) {
    return
  }

  if (findClosestTraceInfo(el)) {
    client.value!.host.nuxt.$tracerOverlay.state.main = findClosestTraceInfo((el))
    client.value!.host.nuxt.$tracerOverlay.state.isVisible = true
    el.scrollIntoView({
      behavior: 'smooth',
    })
  }
}

function mouseOutElement(el?: HTMLElement) {
  if (!el) {
    return
  }
  client.value!.host.nuxt.$tracerOverlay.state.isVisible = false
}
</script>

<template>
  <div p-4>
    <NCard v-for="image in imagePerformances" flex gap-4 p-4 relative>
      <button class="absolute top-2 right-2" title="open in editor" @click="openElementSourceComponent(image.element)">
        <Icon name="material-symbols:file-open-outline" />
      </button>
      <div class="w-1/5" my-auto>
        <img class="rounded bg-white" :src="image.element.src" alt="Image performance" object-contain my-auto
          :title="image.element.src" @mouseover="e => mouseOverElement(image.element as HTMLElement)"
          @mouseout="e => mouseOutElement(image.element as HTMLElement)">
        <div>
          <p style="text-overflow: ellipsis;" overflow-hidden text-nowrap>
            {{ image.element.src }}
          </p>
        </div>
      </div>
      <div>
        Issues:

        <div v-for="issue in image.issues" flex gap-2 color="red" text-sm>
          <p v-if="issue.type === ImagePerformanceIssueType.FetchPriorityMissingOnLCPElement">
            Fetch priority missing on LCP element
          </p>
          <p v-if="issue.type === ImagePerformanceIssueType.HeightWidthMissingOnLCPElement">
            Height and width missing on LCP element
          </p>
          <p v-else-if="issue.type === ImagePerformanceIssueType.ImgFormat">
            Prefer next-gen image format like webp or avif
          </p>
          <p v-else-if="issue.type === ImagePerformanceIssueType.LazyAttrOnLCPElement">
            Lazy attribute on LCP element
          </p>
          <p v-else-if="issue.type === ImagePerformanceIssueType.LoadingTooLong">
            Loading too long
          </p>
          <p v-else-if="issue.type === ImagePerformanceIssueType.PreloadMissingOnLCPElement">
            Preload missing on LCP element
          </p>
        </div>
      </div>
    </NCard>
  </div>
</template>
