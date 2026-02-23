import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { defu } from 'defu'

export default defineNuxtPlugin({
  name: '@nuxt/hints:hydration',
  setup() {
    const nuxtApp = useNuxtApp()
    nuxtApp.payload.__hints = defu(nuxtApp.payload.__hints, {
      hydration: [],
    })
  },
})
