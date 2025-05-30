import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin({
  name: '@nuxt/hints:hydration',
  setup(nuxtApp) {
    nuxtApp.__hintsHydration = []
  },
})
