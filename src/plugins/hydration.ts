import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { parseSync, type ImportDeclaration, type ImportDeclarationSpecifier, type ImportSpecifier } from 'oxc-parser'
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

          const defineComponentImport = findImportSpecifier(
            imports,
            'defineComponent',
            ['vue', '#imports'],
            (specifier, nextSpecifier) => {
              m.remove(
                specifier.start,
                nextSpecifier?.start ?? specifier.end,
              )
            },
          )
          const defineComponentAlias = defineComponentImport?.local.name || 'defineComponent'

          const defineNuxtComponentImport = findImportSpecifier(
            imports,
            'defineNuxtComponent',
            ['#app/composables/component', '#imports', '#app', 'nuxt/app'],
            (specifier, next) => {
              m.remove(
                specifier.start,
                next?.start ?? specifier.end,
              )
            },
          )
          const defineNuxtComponentAlias = defineNuxtComponentImport?.local.name || 'defineNuxtComponent'

          const importsToAdd = new Set([
            hasDefineComponent
            && genImport(
              '@nuxt/hints/runtime/hydration/component',
              [defineComponentAlias === 'defineComponent' ? 'defineComponent' : { name: 'defineComponent', as: defineComponentAlias }],
            ),
            hasDefineNuxtComponent
            && genImport(
              '@nuxt/hints/runtime/hydration/component',
              [defineNuxtComponentAlias === 'defineNuxtComponent' ? 'defineNuxtComponent' : { name: 'defineNuxtComponent', as: defineNuxtComponentAlias }],
            ),
          ].filter(Boolean))

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
function findImportSpecifier(
  importDecl: ImportDeclaration[],
  importedName: string,
  pkgNames: string | string[],
  callback?: (specifier: ImportSpecifier, nextSpecifier?: ImportDeclarationSpecifier) => void,
) {
  const names = Array.isArray(pkgNames) ? pkgNames : [pkgNames]
  const decl = importDecl.find(imp => names.includes(imp.source.value))
  if (!decl) {
    return
  }
  for (let i = 0; i < decl.specifiers.length; i++) {
    const specifier = decl.specifiers[i]!
    if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === importedName) {
      callback?.(specifier, decl.specifiers[i + 1])
      return specifier
    }
  }
}
