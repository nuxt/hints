import type { ComponentOptions } from 'vue'
import NuxtIsland from '#app/components/nuxt-island'
import { useNuxtApp } from '#imports'
import { logger } from '../../logger'

const originalSetup = (NuxtIsland as unknown as ComponentOptions).setup!
const HintsNuxtIsland: typeof NuxtIsland = Object.assign({}, NuxtIsland, {
  setup(props, ctx) {
    if (useNuxtApp().ssrContext?.islandContext) {
      logger.warn(
        `Nesting islands within islands is not recommanded for performance reasons. This leads to waterfall calls.`,
      )
    }
    return originalSetup(props, ctx)
  },
} satisfies ComponentOptions)

export default HintsNuxtIsland
