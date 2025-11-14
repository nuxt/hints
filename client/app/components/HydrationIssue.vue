<script setup lang="ts">
import { codeToHtml } from 'shiki/bundle/web'
import type { ComponentInternalInstance, VNode } from 'vue'
import { diffLines, type ChangeObject } from 'diff'
import { transformerNotationDiff } from '@shikijs/transformers'

const props = defineProps<{
  issue: { instance: ComponentInternalInstance, vnode: VNode, htmlPreHydration: string | undefined, htmlPostHydration: string | undefined }
}>()

type MaybeNamed = Partial<Record<'name' | '__name' | '__file', string>>
const componentName = computed(() => (props.issue.instance.type as MaybeNamed).name ?? (props.issue.instance.type as MaybeNamed).__name ?? 'AnonymousComponent')
const filePath = computed(() => (props.issue.instance.type as MaybeNamed).__file as string | undefined)
const rootTag = computed(() => (props.issue.instance.vnode.el as HTMLElement | null)?.tagName?.toLowerCase() || 'unknown')
const element = computed(() => props.issue.instance.vnode.el as HTMLElement | undefined)

const { highlightElement, inspectElementInEditor, clearHighlight } = useElementHighlighter()

const diffHtml = ref('')

async function render(pre: string, post: string) {
  const diff = diffLines(pre, post, { stripTrailingCr: true, ignoreNewlineAtEof: true })
  diffHtml.value = await codeToHtml(generateDiffHtml(diff), {
    theme: 'github-dark', lang: 'html', transformers: [
      transformerNotationDiff(),
    ],
  })
}

function generateDiffHtml(change: ChangeObject<string>[]) {
  return change.map((part) => {
    if (part.added) {
      return `// [!code ++]\n${part.value}`
    }
    else if (part.removed) {
      return `// [!code --]\n${part.value} `
    }
    else {
      return part.value
    }
  }).join('')
}

const fullPre = computed(() => props.issue.htmlPreHydration ?? '')
const fullPost = computed(() => props.issue.htmlPostHydration ?? '')

watch([fullPre, fullPost], ([newPre, newPost]) => {
  render(newPre, newPost)
}, { immediate: true })

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => { })
}
</script>

<template>
  <n-card p-4 relative>
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-sm font-semibold">
          {{ componentName }}
        </div>
        <div class="text-xs text-neutral-500 truncate">
          {{ filePath }}
        </div>
        <div class="mt-1 flex flex-wrap gap-2 text-[11px]">
          <n-tip size="small" title="Root element tag where mismatch was detected.">
            root: {{ rootTag }}
          </n-tip>
        </div>
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <n-button size="small" quaternary title="Open in editor" @mouseover="highlightElement(element)"
          @mouseleave="clearHighlight()" @click="inspectElementInEditor(element)">
          <Icon name="material-symbols:file-open-outline" class="text-lg" />
        </n-button>
        <n-button size="small" quaternary @click="copy(fullPre)">
          <Icon name="material-symbols:content-copy-outline" class="text-lg" />
          <span class="ml-1">Copy pre</span>
        </n-button>
        <n-button size="small" quaternary @click="copy(fullPost)">
          <Icon name="material-symbols:content-copy-outline" class="text-lg" />
          <span class="ml-1">Copy post</span>
        </n-button>
      </div>
    </div>

    <div class="w-full mt-3 overflow-auto rounded-lg" v-html="diffHtml" />
  </n-card>
</template>

<style lang="scss" scoped>
:deep(.diff) {
  &.add {
    background-color: rgba(22, 163, 74, 0.15); // green-600 at 15% opacity
  }

  &.remove {
    background-color: rgba(220, 38, 38, 0.15); // red-600 at 15% opacity
  }
}
</style>
