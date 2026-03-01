<script setup lang="ts">
import type { HtmlValidateReport } from '../../../../src/runtime/html-validate/types'

const htmlValidateReports = useNuxtApp().$htmlValidateReports
const errorCount = computed(() =>
  htmlValidateReports.value.reduce(
    (sum: number, report: HtmlValidateReport) => sum + report.results.reduce(
      (rSum: number, result: { messages: unknown[] }) => rSum + result.messages.length,
      0,
    ),
    0,
  ),
)
</script>

<template>
  <NuxtLink
    to="/html-validate"
    class="block"
  >
    <n-card class="flex items-center justify-between p-4 hover:border-neutral-400 dark:hover:border-neutral-500">
      <div class="flex items-center gap-3 min-w-0">
        <Icon
          name="material-symbols:code"
          class="text-xl text-rose-500"
        />
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">
            HTML Validate
          </div>
          <div class="text-xs text-neutral-500">
            HTML standard violations
          </div>
        </div>
      </div>
      <n-tip
        v-if="errorCount"
        size="small"
        type="error"
        :bordered="false"
      >
        {{ errorCount }} errors
      </n-tip>
    </n-card>
  </NuxtLink>
</template>
