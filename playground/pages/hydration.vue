<script setup lang="ts">
const isServer = import.meta.server ? 1 : 0
</script>

<template>
  <div>
    <p
      :data-test="isServer ? 'server' : 'client'"
      class="fzejkebkzjefbjkzebfkjzebfkjzebfzebfkjzebkfjbzekjjjjjjjjjjjjjjjjjjjjkfzebjkfbzkjebfjkjk"
    >
      isServer: {{ isServer }} <span v-if="!isServer">test</span>
    </p>

    <div
      :class="isServer ? '1561561' : 'text-green-500'"
      :data-test="isServer ? 'server' : 'client'"
    >
      yolooo
    </div>
  </div>
</template>
