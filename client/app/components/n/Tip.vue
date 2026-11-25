<script setup lang="ts">
type TipType = 'default' | 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{
  type?: TipType
  size?: 'small' | 'medium'
  bordered?: boolean
}>(), {
  type: 'default',
  size: 'medium',
  bordered: true,
})

const TYPE_CLASSES: Record<TipType, string> = {
  default: 'text-neutral-600 dark:text-neutral-300 bg-neutral-500/10 border-neutral-500/25',
  info: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/25',
  success: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/25',
  warning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
  error: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/25',
}

const classes = computed(() => [
  TYPE_CLASSES[props.type],
  props.bordered ? 'border' : 'border-0',
  props.size === 'small' ? 'px-2 py-0.5 text-xs' : 'px-4 py-2 text-sm',
])
</script>

<template>
  <div
    class="inline-flex items-center gap-1 rounded"
    :class="classes"
  >
    <slot />
  </div>
</template>
