import * as tracerOverlay from 'vite-plugin-vue-tracer/client/overlay'
import * as tracerRecord from 'vite-plugin-vue-tracer/client/record'
import { defineNuxtPlugin } from '#imports'

// provide tracer from main app/iframe context
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.__tracerOverlay = tracerOverlay
  nuxtApp.__tracerRecord = tracerRecord
})
