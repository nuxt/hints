<script setup lang="ts">
import TreeNode from './_TreeNode.vue'

const tree = { label: 'root', children: [{ label: 'child', children: [] }] }
</script>

<template>
  <TreeNode :node="tree" />
</template>
