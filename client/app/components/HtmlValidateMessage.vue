<script setup lang="ts">
import type { Message } from 'html-validate'

defineProps<{
  message: Message
}>()

const SEVERITY_MAP: Record<number, string> = {
  1: 'Warning',
  2: 'Error',
}

function getColorClassBySeverity(severity: number): string {
  switch (severity) {
    case 1:
      return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30'
    case 2:
      return 'text-red-500 bg-red-100 dark:bg-red-900/30'
    default:
      return 'text-gray-500 bg-gray-100 dark:bg-gray-900/30'
  }
}
</script>

<template>
  <tr class="border-b border-neutral-100 dark:border-neutral-800 last:border-b-0">
    <td class="py-2">
      <n-tip
        size="small"
        :class="getColorClassBySeverity(message.severity)"
      >
        {{ SEVERITY_MAP[message.severity] || 'Unknown' }}
      </n-tip>
    </td>
    <td class="py-2">
      <code class="text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
        {{ message.ruleId }}
      </code>
    </td>
    <td class="py-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
      {{ message.line }}:{{ message.column }}
    </td>
    <td class="py-2 text-xs text-neutral-600 dark:text-neutral-300">
      {{ message.message }}
    </td>
  </tr>
</template>
