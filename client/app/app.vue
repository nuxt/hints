<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

const client = useDevtoolsClient()
</script>

<template>
  <div>
    <NuxtLayout v-if="client">
      <NuxtPage />
    </NuxtLayout>
    <NLoading v-else />
  </div>
</template>
