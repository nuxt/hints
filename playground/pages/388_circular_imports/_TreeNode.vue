<script setup lang="ts">
import TreeChildren from './_TreeChildren.vue'
import type { TreeNodeData } from './_TreeChildren.vue'

defineProps<{ node: TreeNodeData }>()
</script>

<template>
  <div>
    {{ node.label }}
    <TreeChildren :items="node.children" />
  </div>
</template>
