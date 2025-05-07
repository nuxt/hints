import MagicString from 'magic-string'
import { createUnplugin } from 'unplugin'

export const InjectHydrationPlugin = createUnplugin(() => {
  return {
    name: '@nuxt/hints:inject-hydration-check',
    enforce: 'pre',
    transformInclude(id) {
      return id.endsWith('.vue') && !id.includes('node_modules')
    },
    transform(code) {
      const m = new MagicString(code)
      const re = /<script\s+setup[^>]*>/g
      const match = re.exec(code)
      if (!match) {
        return code
      }

      // Add useHydrationCheck after the <script setup> tag
      m.appendRight(
        match.index + match[0].length,
        `\nimport { useHydrationCheck } from '@nuxt/hints/runtime/composables/hydration'\nuseHydrationCheck();`
      )

      return {
        code: m.toString(),
        map: m.generateMap({ hires: true }),
      }
    },
  }
})
