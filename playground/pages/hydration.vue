<script setup lang="ts">
const isServer = import.meta.server ? 1 : 0
</script>

<template>
  <div>
    <p>isServer: {{ isServer }}</p>
  </div>
</template>
