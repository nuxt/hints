<script setup lang="ts">
import TreeNode from './_TreeNode.vue'

export interface TreeNodeData {
  label: string
  children: TreeNodeData[]
}

defineProps<{ items: TreeNodeData[] }>()
</script>

<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.label"
    >
      <TreeNode :node="item" />
    </li>
  </ul>
</template>
