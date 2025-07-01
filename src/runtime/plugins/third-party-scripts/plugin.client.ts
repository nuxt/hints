import { defineNuxtPlugin } from '#imports'

declare global {
  interface Window {
    __hints_TPC_start_time: number
  }
  interface HTMLScriptElement {
    __hints_TPC_start_time?: number
    __hints_TPC_end_time?: number
  }
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hooks.hookOnce('app:mounted', () => {
    const scripts = document.scripts
    let hasThirdPartyScript = false
    for (const script of scripts) {
      if (script.src && script.src.startsWith('http')) {
        hasThirdPartyScript = true
        const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        script.__hints_TPC_start_time = (navigationEntry ? performance.timeOrigin + navigationEntry.domContentLoadedEventStart : window.__hints_TPC_start_time) || window.__hints_TPC_start_time
      }
    }
    console.log('[@nuxt/hints]: 📊 Third-party scripts detected on page load: consider using @nuxt/scripts')
  })
})
