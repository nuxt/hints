<script setup lang="ts">
import type { HtmlValidateReport } from '../../../src/runtime/html-validate/types'

definePageMeta({
  title: 'HTML Validate',
  middleware: 'feature-gate',
  feature: 'htmlValidate',
})

const nuxtApp = useNuxtApp()

const reports = computed(() => nuxtApp.$htmlValidateReports.value)

function dismiss(id: string) {
  nuxtApp.$htmlValidateReports.value = nuxtApp.$htmlValidateReports.value.filter((r: HtmlValidateReport) => r.id !== id)
}
</script>

<template>
  <div
    grid
    gap-4
    p-4
  >
    <template v-if="reports.length > 0">
      <HtmlValidateIssue
        v-for="report in reports"
        :key="report.id"
        :report="report"
        @dismiss="dismiss"
      />
    </template>

    <div
      v-else
      class="text-neutral-500 dark:text-neutral-400"
    >
      No HTML validation issues found. Render some pages server-side and refresh this page to see results.
    </div>
  </div>
</template>
