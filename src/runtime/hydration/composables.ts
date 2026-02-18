import { getCurrentInstance, inject, onMounted } from 'vue'
import { useNuxtApp } from '#imports'
import { HYDRATION_ROUTE, formatHTML } from './utils'
import { logger } from '../logger'
import type { HydrationMismatchPayload } from './types'
import { clientOnlySymbol } from '#app/components/client-only'
/**
 * prefer implementing onMismatch hook after vue 3.6
 * compare element
 */
export function useHydrationCheck() {
  const isClientOnly = inject(clientOnlySymbol, false)

  if (import.meta.server || isClientOnly) {
    return
  }

  const nuxtApp = useNuxtApp()

  if (!nuxtApp.isHydrating || !nuxtApp.payload.serverRendered) {
    return
  }

  const instance = getCurrentInstance()

  if (!instance) return

  const htmlPreHydration = formatHTML(instance.vnode.el?.outerHTML)
  const vnodePrehydration = instance.vnode

  onMounted(() => {
    const htmlPostHydration = formatHTML(instance.vnode.el?.outerHTML)
    if (htmlPreHydration !== htmlPostHydration) {
      const componentName = instance.type.name ?? instance.type.displayName ?? instance.type.__name
      const fileLocation = instance.type.__file ?? 'unknown'
      const body = {
        htmlPreHydration,
        htmlPostHydration,
        componentName,
        fileLocation,
      }
      $fetch<HydrationMismatchPayload>(new URL(HYDRATION_ROUTE, window.location.origin).href, {
        method: 'POST',
        body,
      }).then((payload) => {
        nuxtApp.__hints.hydration.push({
          ...payload,
          instance,
          vnode: vnodePrehydration,
        })
      })
      logger.warn(`[hydration] Component ${componentName ?? instance.type.__file} seems to have different html pre and post-hydration. Please make sure you don't have any hydration issue.`)
    }
  })
}
