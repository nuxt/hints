<script setup lang="ts">
import { codeToHtml } from 'shiki/bundle/web'
import type { ComponentInternalInstance, VNode } from 'vue'

const props = defineProps<{
  issue: { instance: ComponentInternalInstance, vnode: VNode, htmlPreHydration: string | undefined, htmlPostHydration: string | undefined }
}>()

type MaybeNamed = Partial<Record<'name' | '__name' | '__file', string>>
const componentName = computed(() => (props.issue.instance.type as MaybeNamed).name ?? (props.issue.instance.type as MaybeNamed).__name ?? 'AnonymousComponent')
const filePath = computed(() => (props.issue.instance.type as MaybeNamed).__file as string | undefined)
const rootTag = computed(() => (props.issue.instance.vnode.el as HTMLElement | null)?.tagName?.toLowerCase() || 'unknown')
const element = computed(() => props.issue.instance.vnode.el as HTMLElement | undefined)

const { highlightElement, inspectElementInEditor, clearHighlight } = useElementHighlighter()

const compact = ref(true)
const contextLines = 3

function diffSlice(a: string, b: string) {
  const la = (a || '').split('\n')
  const lb = (b || '').split('\n')
  let start = 0
  while (start < la.length && start < lb.length && la[start] === lb[start]) start++
  let enda = la.length - 1
  let endb = lb.length - 1
  while (enda >= start && endb >= start && la[enda] === lb[endb]) {
    enda--
    endb--
  }
  // If identical, show a small head
  if (start >= la.length && start >= lb.length) {
    return {
      a: la.slice(0, Math.min(10, la.length)).join('\n'),
      b: lb.slice(0, Math.min(10, lb.length)).join('\n'),
    }
  }
  const from = Math.max(0, start - contextLines)
  const toA = Math.min(la.length, enda + 1 + contextLines)
  const toB = Math.min(lb.length, endb + 1 + contextLines)
  return {
    a: la.slice(from, toA).join('\n'),
    b: lb.slice(from, toB).join('\n'),
  }
}

const preHtml = ref('')
const postHtml = ref('')

async function render(pre: string, post: string) {
  const preOut = await codeToHtml(pre, { theme: 'github-dark', lang: 'html' })
  const postOut = await codeToHtml(post, { theme: 'github-dark', lang: 'html' })
  preHtml.value = preOut
  postHtml.value = postOut
}

const fullPre = computed(() => props.issue.htmlPreHydration ?? '')
const fullPost = computed(() => props.issue.htmlPostHydration ?? '')

watchEffect(async () => {
  const pre = fullPre.value
  const post = fullPost.value
  if (compact.value) {
    const { a, b } = diffSlice(pre, post)
    await render(a, b)
  }
  else {
    await render(pre, post)
  }
})

function copy(text: string) {
  navigator.clipboard?.writeText(text).catch(() => {})
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
        <div class="text-xs text-gray-500 truncate">
          {{ filePath }}
        </div>
        <div class="mt-1 flex flex-wrap gap-2 text-[11px]">
          <n-tag
            size="small"
            title="Root element tag where mismatch was detected."
          >
            root: {{ rootTag }}
          </n-tag>
        </div>
      </div>
      <div class="shrink-0 flex items-center gap-2">
        <n-button
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
          @click="compact = !compact"
        >
          <Icon
            name="material-symbols:compare-arrows"
            class="text-lg"
          />
          <span class="ml-1">{{ compact ? 'Show full' : 'Compact' }}</span>
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

    <div class="grid mt-3 gap-2 grid-cols-2">
      <div>
        <div class="text-xs text-gray-500 mb-1">
          Pre Hydration
        </div>
        <div
          class="w-full overflow-auto"
          v-html="preHtml"
        />
      </div>
      <div>
        <div class="text-xs text-gray-500 mb-1">
          Post Hydration
        </div>
        <div
          class="w-full overflow-auto"
          v-html="postHtml"
        />
      </div>
    </div>
  </n-card>
</template>
