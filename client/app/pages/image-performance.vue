<script setup lang="ts">
import { ImagePerformanceIssueType } from '../../../src/runtime/plugins/performance/utils'

definePageMeta({
  title: 'Image Performances',
})

const { imagePerformances } = useHostPerformancesData()
</script>

<template>
  <div p-4>
    <NCard
      v-for="image in imagePerformances"
      flex
      gap-4
      p-4
    >
      <div
        class="w-1/5"
        my-auto
      >
        <img
          class="rounded bg-white"
          :src="image.element.src"
          alt="Image performance"
          object-contain
          my-auto
          :title="image.element.src"
        >
        <div>
          <p
            style="text-overflow: ellipsis;"
            overflow-hidden
            text-nowrap
          >
            {{ image.element.src }}
          </p>
        </div>
      </div>
      <div>
        Issues:

        <div
          v-for="issue in image.issues"
          flex
          gap-2
          color="red"
          text-sm
        >
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
