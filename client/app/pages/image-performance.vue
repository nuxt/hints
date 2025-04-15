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
        >
          <div v-if="issue.type === ImagePerformanceIssueType.FetchPriorityMissingOnLCPElement">
            <NTag
              color="red"
              text-sm
            >
              Fetch priority missing on LCP element
            </NTag>
          </div>
          <div v-if="issue.type === ImagePerformanceIssueType.HeightWidthMissingOnLCPElement">
            <NTag
              color="red"
              text-sm
            >
              Height and width missing on LCP element
            </NTag>
          </div>
          <div v-else-if="issue.type === ImagePerformanceIssueType.ImgFormat">
            <NTag
              color="red"
              text-sm
            >
              Prefer next-gen image format like webp or avif
            </NTag>
          </div>
          <div v-else-if="issue.type === ImagePerformanceIssueType.LazyAttrOnLCPElement">
            <NTag
              color="red"
              text-sm
            >
              Lazy attribute on LCP element
            </NTag>
          </div>
          <div v-else-if="issue.type === ImagePerformanceIssueType.LoadingTooLong">
            <NTag
              color="red"
              text-sm
            >
              Loading too long
            </NTag>
          </div>
          <div v-else-if="issue.type === ImagePerformanceIssueType.PreloadMissingOnLCPElement">
            <NTag
              color="red"
              text-sm
            >
              Preload missing on LCP element
            </NTag>
          </div>
        </div>
      </div>
    </NCard>
  </div>
</template>
