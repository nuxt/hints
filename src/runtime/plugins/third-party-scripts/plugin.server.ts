import { defineNuxtPlugin } from '#imports'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.ssrContext!.head.hooks.hook('tags:beforeResolve', (ctx) => {
    for (const tag of ctx.tags) {
      if (tag.tag === 'script' && tag.props.src && tag.props.src.startsWith('http')) {
        tag.props.onload = `__hints_TPC_saveTime.call(this, event, Date.now())`
      }
    }
  })
})
