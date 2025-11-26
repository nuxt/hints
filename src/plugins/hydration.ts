import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { parseSync, type ImportDeclaration } from 'oxc-parser'
import { createUnplugin } from 'unplugin'

const INCLUDE_VUE_RE = /\.vue$/
const EXCLUDE_NODE_MODULES = /node_modules/
const DEFINE_COMPONENT_RE = /defineComponent/
const DEFINE_NUXT_COMPONENT_RE = /defineNuxtComponent/
export const InjectHydrationPlugin = createUnplugin(() => {
  return [
    {
      name: '@nuxt/hints:modify-hydration-composable-import',
      enforce: 'post',
      transform: {
        filter: {
          id: {
            include: /.(vue|ts|js|tsx|jsx)$/,
            exclude: EXCLUDE_NODE_MODULES,
          },
          code: /defineNuxtComponent|defineComponent/,
        },
        handler(code, id) {
          const m = new MagicString(code)
          const { program } = parseSync(id, code)
          const imports = program.body.filter(node => node.type === 'ImportDeclaration')
          const hasDefineComponent = DEFINE_COMPONENT_RE.test(code)
          const hasDefineNuxtComponent = DEFINE_NUXT_COMPONENT_RE.test(code)
          const importsToAdd = new Set([
            hasDefineComponent
            && genImport(
              '@nuxt/hints/runtime/hydration/component',
              ['defineComponent'],
            ),
            hasDefineNuxtComponent
            && genImport(
              '@nuxt/hints/runtime/hydration/component',
              ['defineNuxtComponent'],
            ),
          ].filter(Boolean))

          const defineComponentImport = findImportSpecifier(imports as ImportDeclaration[], 'defineComponent', ['vue', '#imports'])
          if (defineComponentImport) {
            m.remove(
              defineComponentImport.start,
              defineComponentImport.end,
            )
          }
          const defineNuxtComponentImport = findImportSpecifier(imports as ImportDeclaration[], 'defineNuxtComponent', ['#app/composables/component', '#imports', '#app', 'nuxt/app'])
          if (defineNuxtComponentImport) {
            m.remove(
              defineNuxtComponentImport.start,
              defineNuxtComponentImport.end,
            )
          }

          m.prepend([...importsToAdd].join('\n') + '\n')

          if (m.hasChanged()) {
            return {
              code: m.toString(),
              map: m.generateMap({ hires: true }),
            }
          }
        },
      },
    },

    {
      name: '@nuxt/hints:inject-hydration-composable',
      enforce: 'post',
      transformInclude(id) {
        return id.endsWith('.vue') && !id.includes('node_modules')
      },
      transform: {
        filter: {
          id: {
            include: INCLUDE_VUE_RE,
            exclude: EXCLUDE_NODE_MODULES,
          },
          code: /(?!defineComponent|defineNuxtComponent)/,
        },

        handler(code, id) {
          const m = new MagicString(code)
          const { program } = parseSync(id, code)

          const exportDeclaration = program.body.find(node =>
            node.type === 'ExportDefaultDeclaration',
          )?.declaration

          if (exportDeclaration) {
            m.prepend(genImport(
              '@nuxt/hints/runtime/hydration/component',
              ['defineComponent'],
            ))

            m.overwrite(
              exportDeclaration.start,
              exportDeclaration.end,
              `defineComponent(${code.slice(exportDeclaration.start, exportDeclaration.end)})`,
            )
          }

          if (m.hasChanged()) {
            return {
              code: m.toString(),
              map: m.generateMap({ hires: true }),
            }
          }
        },
      },
    }]
})

/**
 * Finds an import specifier for a given imported name from specified package names.
 */
function findImportSpecifier(importDecl: ImportDeclaration[], importedName: string, pkgNames: string | string[]) {
  const names = Array.isArray(pkgNames) ? pkgNames : [pkgNames]
  return importDecl.find(imp => names.includes(imp.source.value))?.specifiers.find((specifier) => {
    return specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === importedName
  })
}
