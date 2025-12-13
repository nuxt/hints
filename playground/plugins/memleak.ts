import { defineNuxtPlugin, ref } from '#imports'

ref('memory-leak-warning-shown')

export default defineNuxtPlugin(() => {
  // Show memory leak warning
})
