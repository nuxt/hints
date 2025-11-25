import MagicString from 'magic-string'
import { parseSync } from 'oxc-parser'
import { createUnplugin } from 'unplugin'

const ID_INCLUDE = /\.vue$/
const ID_EXCLUDE = /node_modules/
export const InjectHydrationPlugin = createUnplugin(() => {
  return {
    name: '@nuxt/hints:inject-hydration-check',
    enforce: 'post',
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

      handler(code, id) {
        const m = new MagicString(code)

        const { program } = parseSync(id, code)

        const exportDeclaration = program.body.find(node =>
          node.type === 'ExportDefaultDeclaration',
        )?.declaration

        if (exportDeclaration) {
          m.prepend(`import { defineComponent } from '@nuxt/hints/runtime/hydration/component';`)

          m.overwrite(
            exportDeclaration.start,
            exportDeclaration.end,
            `defineComponent(${code.slice(exportDeclaration.start, exportDeclaration.end)})`,
          )
        }

        return {
          code: m.toString(),
          map: m.generateMap({ hires: true }),
        }
      },
    },
  }
})
