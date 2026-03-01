<script setup lang="ts">
import { codeToHtml } from 'shiki'
import type { HtmlValidateReport } from '../../../src/runtime/html-validate/types'
import { HTML_VALIDATE_ROUTE } from '../utils/routes'
import { attachFoldToggleListener, transformerRenderHtmlFold } from 'shiki-transformer-fold'

const props = defineProps<{
  report: HtmlValidateReport
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

const html = computedAsync(() => {
  return codeToHtml(props.report.html, {
    theme: 'github-dark', lang: 'html', transformers: [
      transformerRenderHtmlFold({
        foldLevel: props.report.html.split('\n').length > 20 ? 2 : 0,
      }),
    ],
  })
})

async function dismiss() {
  emit('dismiss', props.report.id)
  $fetch(new URL(`${HTML_VALIDATE_ROUTE}/${props.report.id}`, window.location.origin).href, { method: 'DELETE' })
}

onMounted(() => {
  attachFoldToggleListener()
})
</script>

<template>
  <n-card class="p4 grid gap-3">
    <header class="flex items-center justify-between">
      <div class="min-w-0">
        <span class="text-sm font-semibold">{{ report.path || 'Unknown path' }}</span>
        <span class="text-xs text-neutral-400 ml-2">{{ report.results.length }} issues</span>
      </div>
      <n-button
        title="Remove"
        size="small"
        quaternary
        @click="dismiss"
      >
        <Icon
          name="material-symbols:delete-outline"
          class="text-lg"
        />
      </n-button>
    </header>

    <div class="grid gap-4">
      <HtmlValidateResult
        v-for="(result, i) in report.results"
        :key="i"
        :result="result"
      />
    </div>

    <div
      v-if="html"
      class="overflow-auto rounded-lg overflow-auto w-full flex"
    >
      <div
        w-full
        overflow-auto
        v-html="html"
      />
    </div>
  </n-card>
</template>
