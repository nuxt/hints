<script setup lang="ts">
const route = useRoute()

const pageTitle = computed(() => {
  return route.meta.title
})
</script>

<template>
  <header
    sticky
    top-0
    z-10
    flex
    px-4
    border="b base"
    w-full
    h-49px
    items-center
    font-semibold
    text-neutral-800
    dark:text-white
    gap-1
    n-bg-base
    n-border-base
  >
    <NuxtLink
      to="/"
      :class="pageTitle ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-800 dark:text-white'"
    >Hints</NuxtLink>
    <template v-if="pageTitle">
      <Icon name="carbon:chevron-right" />
      <div>
        {{ pageTitle }}
      </div>
    </template>
  </header>
</template>
