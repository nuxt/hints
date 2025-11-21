import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'

const ID_INCLUDE = /\.vue$/
const ID_EXCLUDE = /node_modules/
export const InjectHydrationPlugin = createUnplugin(() => {
  return {
    name: '@nuxt/hints:inject-hydration-check',
    enforce: 'pre',
    transformInclude(id) {
      return id.endsWith('.vue') && !id.includes('node_modules')
    },
    transform: {
      filter: {
        id: {
          include: ID_INCLUDE,
          exclude: ID_EXCLUDE,
        },
      },

      handler(code) {
        const m = new MagicString(code)
        const re = /<script\s+setup[^>]*>/g
        const match = re.exec(code)
        if (!match) {
          return code
        }

        // Add useHydrationCheck after the <script setup> tag
        m.appendRight(
          match.index + match[0].length,
          `\nimport { useHydrationCheck } from '@nuxt/hints/runtime/hydration/composables'\nuseHydrationCheck();`,
        )

        return {
          code: m.toString(),
          map: m.generateMap({ hires: true }),
        }
      },
    },
  }
})
