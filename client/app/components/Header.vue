<script setup lang="ts">
const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title
})
</script>

<template>
  <header
    flex
    px-4
    py-2
    border="b base"
    text-2xl
    font-bold
    text-gray-800
    dark:text-white
    gap-4
    n-border-base
  >
    <NuxtLink to="/">@nuxt/hints</NuxtLink>
    <template v-if="pageTitle">
      -
      <div>
        {{ pageTitle }}
      </div>
    </template>
  </header>
</template>
