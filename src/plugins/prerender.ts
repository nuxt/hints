import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'

export const serverFlagPrerenderHint = createUnplugin(() => {
  return {
    name: 'hints:prerender-server-flag',

    transform: {
      filter: {
        code: /import\.meta\.server/,
        id: {
          exclude: /node_modules/,
        },
      },
      handler(code, id) {
        if (id.includes('node_modules') || !code.includes('import.meta.server')) {
          return null
        }
        const s = new MagicString(code)

        // ssrContext access will trigger prerender flagging
        s.replaceAll('import.meta.server', '(__tryUseNuxtApp()?.ssrContext && import.meta.server)')

        s.prepend(`import { tryUseNuxtApp as __tryUseNuxtApp } from '#imports';\n`)
        return {
          code: s.toString(),
          map: s.generateMap({ hires: true }),
        }
      },
    },
  }
})
