import NuxtIsland from '#app/components/nuxt-island'
import { useNuxtApp } from '#imports'

const originalSetup = NuxtIsland.setup!
const HintsNuxtIsland = {
  ...NuxtIsland,
  // @ts-expect-error typed by NuxtIsland
  setup(props, ctx) {
    if (useNuxtApp().ssrContext?.islandContext) {
      console.warn(
        `[@nuxt/hints] Nesting islands within islands is not recommanded for performance reasons. This leads to waterfall calls.`,
      )
    }
    return originalSetup(props, ctx)
  },
}
export default HintsNuxtIsland
