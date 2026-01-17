import { getCurrentInstance, onMounted } from 'vue'
import { useNuxtApp } from '#imports'
import { HYDRATION_ROUTE, formatHTML } from './utils'
import { logger } from '../logger'
import type { HydrationMismatchPayload } from './types'
/**
 * prefer implementing onMismatch hook after vue 3.6
 * compare element
 */
export function useHydrationCheck() {
  if (import.meta.server) return
  const nuxtApp = useNuxtApp()

  if (!nuxtApp.isHydrating) {
    return
  }

  const instance = getCurrentInstance()

  if (!instance) return

  const htmlPreHydration = formatHTML(instance.vnode.el?.outerHTML)
  const vnodePrehydration = instance.vnode

  onMounted(() => {
    const htmlPostHydration = formatHTML(instance.vnode.el?.outerHTML)
    if (htmlPreHydration !== htmlPostHydration) {
      const payload: HydrationMismatchPayload = {
        htmlPreHydration: htmlPreHydration,
        htmlPostHydration: htmlPostHydration,
        id: globalThis.crypto.randomUUID(),
        componentName: instance.type.name ?? instance.type.displayName ?? instance.type.__name,
        fileLocation: instance.type.__file ?? 'unknown',
      }
      nuxtApp.__hints.hydration.push({
        ...payload,
        instance,
        vnode: vnodePrehydration,
      })
      $fetch(new URL(HYDRATION_ROUTE, window.location.origin).href, {
        method: 'POST',
        body: payload,
      })
      logger.warn(`[hydration] Component ${instance.type.name ?? instance.type.displayName ?? instance.type.__name ?? instance.type.__file} seems to have different html pre and post-hydration. Please make sure you don't have any hydration issue.`)
    }
  })
}
