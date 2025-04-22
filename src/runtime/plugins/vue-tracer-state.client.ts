import * as tracerOverlay from 'vite-plugin-vue-tracer/client/overlay'
import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      tracerOverlay,
    },
  }
})
