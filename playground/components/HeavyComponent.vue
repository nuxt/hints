<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="heavy-component">
    <h2>Heavy Component</h2>
    <p>{{ message || 'This is a heavy component that could be lazy loaded' }}</p>
  </div>
</template>

<style scoped>
.heavy-component {
  padding: 20px;
  background: #f0f0f0;
  border-radius: 8px;
  margin: 10px 0;
}
</style>
