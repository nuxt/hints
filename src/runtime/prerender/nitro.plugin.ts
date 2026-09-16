import type { NitroAppPlugin } from 'nitropack'

export default <NitroAppPlugin> function nitroHintsPlugin(nitroApp) {
  nitroApp.hooks.hook('render:before', ({ event }) => {
    event.context.shouldPrerender = true
  })

  nitroApp.hooks.hook('render:html', (htmlContext, { event }) => {
    if (event.context.shouldPrerender === false) {
      htmlContext.bodyAppend.push(
        `<script>window.__NUXT_HINTS_SHOULD_PRERENDER__ = false</script>`,
      )
    }
    else {
      htmlContext.bodyAppend.push(
        `<script>window.__NUXT_HINTS_SHOULD_PRERENDER__ = true</script>`,
      )
    }
  })
}
