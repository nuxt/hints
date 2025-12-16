import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { resolve } from 'node:path'
import { parseSync, type ImportDeclaration, type ImportDeclarationSpecifier, type ImportSpecifier } from 'oxc-parser'
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
          code: {
            include: [DEFINE_COMPONENT_RE, DEFINE_NUXT_COMPONENT_RE],
          },
        },
        async handler(code, id) {
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
            exclude: [skipPath, EXCLUDE_NODE_MODULES],
          },
          code: {
            exclude: [DEFINE_COMPONENT_RE, DEFINE_NUXT_COMPONENT_RE],
          },
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
 * Searches through all matching import declarations since there can be multiple imports from the same package.
 *
 * Like
 * ```ts
 * import { ref } from 'vue'
 * import { defineComponent } from 'vue'
 * ```
 */
function findImportSpecifier(
  importDecl: ImportDeclaration[],
  importedName: string,
  pkgNames: string | string[],
  callback?: (specifier: ImportSpecifier, nextSpecifier?: ImportDeclarationSpecifier) => void,
) {
  const names = Array.isArray(pkgNames) ? pkgNames : [pkgNames]

  const allSpecifiers = importDecl
    .filter(imp => names.includes(imp.source.value))
    .flatMap(decl => decl.specifiers.map((spec, i) => ({ spec, next: decl.specifiers[i + 1] })))

  const match = allSpecifiers.find(({ spec }) =>
    spec.type === 'ImportSpecifier' && spec.imported.type === 'Identifier' && spec.imported.name === importedName,
  )

  if (match) {
    callback?.(match.spec as ImportSpecifier, match.next)
    return match.spec as ImportSpecifier
  }
}

function normalizePath(path: string) {
  return path.replace(/\\/g, '/')
}
