<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'small' | 'medium'
  quaternary?: boolean
  disabled?: boolean
}>(), {
  size: 'medium',
  quaternary: false,
  disabled: false,
})

const classes = computed(() => [
  props.quaternary
    ? 'border-transparent bg-transparent'
    : 'border-base n-bg-base',
  props.size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
])
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1 border rounded cursor-pointer n-transition text-neutral-700 dark:text-neutral-200 hover:bg-neutral-500/10 disabled:op-50 disabled:cursor-not-allowed"
    :class="classes"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
