<script setup lang="ts">
import { useDevtoolsClient, onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { hintIssues } from '../../src/runtime/composables/devtoolsData'
import { toValue, useNuxtApp, useState } from '#imports'

onDevtoolsClientConnected((client) => {
  console.log('connected to devtools client')
})
</script>

<template>
  <div class="relative p-10 n-bg-base flex flex-col h-screen">
    Hints devtools
  </div>
</template>
