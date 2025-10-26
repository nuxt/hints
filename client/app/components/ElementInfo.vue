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
    border-gray-200
    rounded
    p-2
    bg-gray-50
    :class="element ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''"
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
        text-gray-500
      >
        {{ label }}
        <span
          v-if="element"
          text-blue-600
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
