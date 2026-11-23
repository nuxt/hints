import { defineNuxtPlugin } from '#imports'
import { getStackTraceLines } from './utils'

export default defineNuxtPlugin({
  name: 'hints:prerender-detection',
  setup(nuxtApp) {
    const event = nuxtApp.ssrContext!.event

    let watching = true

    const ssrContext = nuxtApp.ssrContext
    // Access to any property on ssrContext will mark the page as non-prerenderable
    Object.defineProperty(nuxtApp, 'ssrContext', {
      get() {
        if (watching && isUserLandCode()) {
          // Mark as non-prerenderable
          // we only want to do this when user-land code is being executed
          // to avoid false positives from internal framework code
          // it's better to be slightly overzealous here than miss actual user code
          event.context.shouldPrerender = false
        }
        return ssrContext
      },
    })

    nuxtApp.hook('app:rendered', () => {
      watching = false
    })
  },
  order: -100000,
})

/**
 * Determine if the current execution context is user-land code
 * by analyzing the stack trace.
 * Should ignore the first line as the fn call is this function itself.
 */
function isUserLandCode(offset: number = 1): boolean {
  const stack = getStackTraceLines()
  const lines = stack.slice(2)
  const line = lines[offset]
  const isUserLand = !line?.includes('node_modules') && !line?.includes('node:internal')
  return isUserLand
}
