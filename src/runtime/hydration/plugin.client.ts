import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { defu } from 'defu'

export default defineNuxtPlugin({
  name: '@nuxt/hints:hydration',
  setup() {
    const nuxtApp = useNuxtApp()
    nuxtApp.__hints = defu(nuxtApp.__hints, {
      hydration: [],
    })
  },
})
