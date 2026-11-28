<script setup lang="ts">
withDefaults(defineProps<{
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  disabled: false,
  type: 'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || undefined"
    :tabindex="disabled ? undefined : 0"
    class="n-button n-button-base n-transition n-disabled:n-disabled active:n-button-active focus-visible:n-focus-base hover:n-button-hover"
  >
    <slot />
  </button>
</template>
