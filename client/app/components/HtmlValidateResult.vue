<script setup lang="ts">
import type { Result } from 'html-validate'

defineProps<{
  result: Result
}>()
</script>

<template>
  <div>
    <div class="text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-mono">
      <span class="text-neutral-400">
        {{ result.errorCount }} errors,
        {{ result.warningCount }} warnings
      </span>
    </div>
    <table class="w-full text-sm">
      <thead>
        <tr class="border-b border-neutral-200 dark:border-neutral-700 text-left text-neutral-500 dark:text-neutral-400">
          <th class="pb-2 font-medium">
            Severity
          </th>
          <th class="pb-2 font-medium">
            Rule
          </th>
          <th class="pb-2 font-medium">
            Location
          </th>
          <th class="pb-2 font-medium">
            Message
          </th>
        </tr>
      </thead>
      <tbody>
        <HtmlValidateMessage
          v-for="(msg, i) in result.messages"
          :key="i"
          :message="msg"
        />
      </tbody>
    </table>
  </div>
</template>
