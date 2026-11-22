import * as tracerOverlay from 'vite-plugin-vue-tracer/client/overlay'
import * as tracerRecord from 'vite-plugin-vue-tracer/client/record'
import { defineNuxtPlugin } from '#imports'
import type { ObjectPlugin, Plugin } from 'nuxt/app'

// provide tracer from main app/iframe context
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.__tracerOverlay = tracerOverlay
  nuxtApp.__tracerRecord = tracerRecord
}) as Plugin & ObjectPlugin
