import type { FeaturesName } from '../../../src/runtime/core/types'

declare module 'nuxt/app' {
  interface PageMeta {
    feature?: FeaturesName
  }
}

export default defineNuxtRouteMiddleware((to) => {
  const feature = to.meta.feature

  if (!feature) return

  const isFeatureEnabled = useHintsFeature(feature)

  if (!isFeatureEnabled) {
    return navigateTo('/', { replace: true })
  }
})
