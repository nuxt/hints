import { getCurrentInstance, onMounted } from "vue"
import { useNuxtApp } from "#imports"
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

    if (!instance) return;

    const htmlPrehydration = instance.vnode.el?.innerHTML
    const vnodePrehydration = instance.vnode

    onMounted(() => {
        const htmlPostHydration = instance.vnode.el?.innerHTML
        if (htmlPrehydration !== htmlPostHydration) {
            nuxtApp.__hintsHydration.push({
                instance,
                vnode: vnodePrehydration,
                htmlPreHydration: htmlPrehydration,
                htmlPostHydration
            })
            console.warn(`[nuxt/hints] Component ${instance.type.name ?? instance.type.displayName ?? instance.type.__name ?? instance.type.__file} seems to have different html pre and post-hydration. Please make sure you don't have any hydration issue.`)
        }
    })
}