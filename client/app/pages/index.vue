<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

const client = useDevtoolsClient()
</script>

<template>
  <div class="relative p-10 n-bg-base flex flex-col">
    <NButton n="xl" flex justify-between items-center to="/image-performance">
      <span>
        Image performances 
      </span>
      <Icon name="material-symbols:chevron-right-rounded" text-5xl />
    </NButton>
  </div>
</template>
