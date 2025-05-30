import { getCurrentInstance, onMounted } from 'vue'
import { useNuxtApp } from '#imports'

function formatHTML(html: string | undefined): string {
  if (!html) return ''
  
  // Simple HTML formatting function
  let formatted = ''
  let indent = 0
  const tags = html.split(/(<\/?[^>]+>)/g)
  
  for (const tag of tags) {
    if (!tag.trim()) continue
    
    if (tag.startsWith('</')) {
      indent--
      formatted += '\n' + '  '.repeat(Math.max(0, indent)) + tag
    } else if (tag.startsWith('<') && !tag.endsWith('/>') && !tag.includes('<!')) {
      formatted += '\n' + '  '.repeat(indent) + tag
      indent++
    } else if (tag.startsWith('<')) {
      formatted += '\n' + '  '.repeat(indent) + tag
    } else {
      formatted += '\n' + '  '.repeat(indent) + tag.trim()
    }
  }
  
  return formatted.trim()
}


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

  const htmlPrehydration = formatHTML(instance.vnode.el?.outerHTML)
  const vnodePrehydration = instance.vnode

  onMounted(() => {
    const htmlPostHydration =formatHTML(instance.vnode.el?.outerHTML) 
    if (htmlPrehydration !== htmlPostHydration) {
      nuxtApp.__hintsHydration.push({
        instance,
        vnode: vnodePrehydration,
        htmlPreHydration: htmlPrehydration,
        htmlPostHydration,
      })
      console.warn(`[nuxt/hints:hydration] Component ${instance.type.name ?? instance.type.displayName ?? instance.type.__name ?? instance.type.__file} seems to have different html pre and post-hydration. Please make sure you don't have any hydration issue.`)
    }
  })
}
