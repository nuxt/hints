import type { Features } from '../../../src/runtime/core/types'

declare module 'nuxt/app' {
  interface PageMeta {
    feature?: Features
  }
}

export default defineNuxtRouteMiddleware((to) => {
  const feature = to.meta.feature

  if (!feature) return

  const config = useHintsConfig()

  if (!config.features[feature]?.devtools) {
    return navigateTo('/')
  }
})
