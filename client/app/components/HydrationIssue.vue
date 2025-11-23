<script setup lang="ts" generic="Issue extends LocalHydrationMismatch | HydrationMismatchPayload">
import { codeToHtml } from 'shiki/bundle/web'
import { diffLines, type ChangeObject } from 'diff'
import { transformerNotationDiff } from '@shikijs/transformers'
import type { HydrationMismatchPayload, LocalHydrationMismatch } from '../../../src/runtime/hydration/types'

const props = defineProps<{
  issue: Issue
}>()

type MaybeNamed = Partial<Record<'name' | '__name' | '__file', string>>

const isLocalIssue = (issue: HydrationMismatchPayload | LocalHydrationMismatch): issue is LocalHydrationMismatch => {
  return 'instance' in issue && 'vnode' in issue
}

const componentName = computed(() => props.issue.componentName ?? 'Unknown component')
const filePath = computed(() => isLocalIssue(props.issue)
  ? (props.issue.instance.type as MaybeNamed).name
  ?? (props.issue.instance.type as MaybeNamed).__name
  ?? (props.issue.instance.type as MaybeNamed).__file
  ?? 'Unknown component'
  : (props.issue as HydrationMismatchPayload).fileLocation,
)

const element = computed(() => isLocalIssue(props.issue) ? props.issue.instance.vnode.el as HTMLElement | undefined : undefined)

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
  <n-card
    p-4
    relative
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="text-sm font-semibold">
          {{ componentName }}
        </div>
        <div class="text-xs text-neutral-500 truncate">
          {{ filePath }}
        </div>
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <n-button
          v-if="element"
          size="small"
          quaternary
          title="Open in editor"
          @mouseover="highlightElement(element)"
          @mouseleave="clearHighlight()"
          @click="inspectElementInEditor(element)"
        >
          <Icon
            name="material-symbols:file-open-outline"
            class="text-lg"
          />
        </n-button>
        <n-button
          size="small"
          quaternary
          @click="copy(fullPre)"
        >
          <Icon
            name="material-symbols:content-copy-outline"
            class="text-lg"
          />
          <span class="ml-1">Copy pre</span>
        </n-button>
        <n-button
          size="small"
          quaternary
          @click="copy(fullPost)"
        >
          <Icon
            name="material-symbols:content-copy-outline"
            class="text-lg"
          />
          <span class="ml-1">Copy post</span>
        </n-button>
      </div>
    </div>

    <div
      class="w-full mt-3 overflow-auto rounded-lg"
      v-html="diffHtml"
    />
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
