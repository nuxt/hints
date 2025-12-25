<script setup lang="ts">
const props = defineProps<{
  label: string
  target?: string
  element?: HTMLElement
}>()

const { highlightElement, clearHighlight, inspectElementInEditor } = useElementHighlighter()

const onEnter = () => {
  if (props.element) highlightElement(props.element)
}
const onLeave = () => {
  clearHighlight()
}
const onClick = () => {
  if (props.element) inspectElementInEditor(props.element)
}
</script>

<template>
  <div
    border
    border-neutral-200
    dark:border-neutral-700
    rounded
    p-2
    bg-neutral-50
    dark:bg-neutral-800
    :class="element ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors' : ''"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @click="onClick"
  >
    <div
      flex
      items-center
      justify-between
      mb-1
    >
      <div
        text-xs
        text-neutral-500
        dark:text-neutral-400
      >
        {{ label }}
        <span
          v-if="element"
          text-blue-600
          dark:text-blue-400
          ml-1
        >(hover to highlight, click to inspect)</span>
      </div>
      <slot name="header-right" />
    </div>
    <code
      v-if="target"
      text-sm
      text-purple-600
    >{{ target }}</code>
    <slot name="sub" />
  </div>
</template>
