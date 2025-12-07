import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { resolve } from 'node:path'
import { parseSync, type ImportDeclaration } from 'oxc-parser'
import { createUnplugin } from 'unplugin'
import { distDir } from '../dirs'

const INCLUDE_VUE_RE = /\.vue$/
const EXCLUDE_NODE_MODULES = /node_modules/
const DEFINE_COMPONENT_RE = /defineComponent/
const DEFINE_NUXT_COMPONENT_RE = /defineNuxtComponent/
const skipPath = normalizePath(resolve(distDir, 'runtime/hydration/component.ts'))
export const InjectHydrationPlugin = createUnplugin(() => {
  return [
    {
      name: '@nuxt/hints:modify-hydration-composable-import',
      enforce: 'post',
      transform: {
        filter: {
          id: {
            include: /.(vue|ts|js|tsx|jsx)$/,
            exclude: [skipPath, EXCLUDE_NODE_MODULES],
          },
          code: /defineNuxtComponent|defineComponent/,
        },
        async handler(code, id) {
          console.log(id)
          const m = new MagicString(code)
          const { program } = parseSync(id, code)
          const imports = program.body.filter(node => node.type === 'ImportDeclaration')
          const hasDefineComponent = DEFINE_COMPONENT_RE.test(code)
          const hasDefineNuxtComponent = DEFINE_NUXT_COMPONENT_RE.test(code)

          const defineComponentImport = findImportSpecifier(imports as ImportDeclaration[], 'defineComponent', ['vue', '#imports'])
          const defineComponentAlias = defineComponentImport?.local.name || 'defineComponent'
          if (defineComponentImport) {
            m.remove(
              defineComponentImport.start,
              defineComponentImport.end,
            )
          }

          const defineNuxtComponentImport = findImportSpecifier(imports as ImportDeclaration[], 'defineNuxtComponent', ['#app/composables/component', '#imports', '#app', 'nuxt/app'])
          const defineNuxtComponentAlias = defineNuxtComponentImport?.local.name || 'defineNuxtComponent'
          if (defineNuxtComponentImport) {
            m.remove(
              defineNuxtComponentImport.start,
              defineNuxtComponentImport.end,
            )
          }

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
            exclude: [skipPath, EXCLUDE_NODE_MODULES],
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

function normalizePath(path: string) {
  return path.replace(/\\/g, '/')
}
