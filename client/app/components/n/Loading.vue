<template>
  <div class="flex flex-col items-center justify-center gap-2 h-screen text-neutral-500">
    <Icon
      name="carbon:circle-dash"
      class="text-3xl animate-spin"
    />
    <slot>Loading...</slot>
  </div>
</template>
