import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  const scripts = document.scripts
  for (const script of scripts) {
    // If the script has another origin, we warn about using @nuxt/scripts
    if (script.src && script.src.startsWith('http') && !script.src.includes(nuxtApp.$config.public.baseURL)) {
      console.warn(`[@nuxt/scripts] Script from another origin detected: ${script.src}. Consider using @nuxt/scripts.`)
    }
  }
})
