<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

const client = useDevtoolsClient()
</script>

<template>
  <div class="relative p-10 n-bg-base flex flex-col h-screen">
    Hints devtools
  </div>
</template>
