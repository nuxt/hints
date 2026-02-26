import { defineNuxtPlugin } from '#imports'
// @ts-expect-error virtual file
import { features } from '#hints-config'

export default defineNuxtPlugin({
  name: 'hints:features',
  setup(nuxtApp) {
    Object.defineProperty(nuxtApp, 'hints', {
      get() {
        return Object.freeze({
          config: {
            features,
          },
        })
      },
    })
  },
})
