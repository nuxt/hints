import MagicString from 'magic-string'
import { parseSync, type ImportDeclaration } from 'oxc-parser'
import { createUnplugin } from 'unplugin'

const ID_INCLUDE = /\.vue$/
const ID_EXCLUDE = /node_modules/
export const InjectHydrationPlugin = createUnplugin(() => {
  return [
    {
      name: '@nuxt/hints:modify-hydration-composable-import',
      enforce: 'post',
      transformInclude(id) {
        return !id.includes('node_modules') && (id.endsWith('.js') || id.endsWith('.ts') || id.endsWith('.vue'))
      },
      transform: {
        filter: {
          id: {
            include: ID_INCLUDE,
            exclude: ID_EXCLUDE,
          },
          code: /defineNuxtComponent|defineComponent/,
        },
        handler(code, id) {
          const m = new MagicString(code)
          const { program } = parseSync(id, code)

          const imports = program.body.filter(node => node.type === 'ImportDeclaration')

          const defineComponentImport = findImportSpecifier(imports as ImportDeclaration[], 'defineComponent', ['vue', '#imports'])
          if (defineComponentImport) {
            m.remove(
              defineComponentImport.start,
              defineComponentImport.end,
            )
            m.prepend(`import { defineComponent } from '@nuxt/hints/runtime/hydration/component';\n`)
          }
          const defineNuxtComponentImport = findImportSpecifier(imports as ImportDeclaration[], 'defineNuxtComponent', ['#app/composables/component', '#imports', '#app', 'nuxt/app'])
          if (defineNuxtComponentImport) {
            m.remove(
              defineNuxtComponentImport.start,
              defineNuxtComponentImport.end,
            )
            m.prepend(`import { defineNuxtComponent } from '@nuxt/hints/runtime/hydration/component';\n`)
          }
          return {
            code: m.toString(),
            map: m.generateMap({ hires: true }),
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
            include: ID_INCLUDE,
            exclude: ID_EXCLUDE,
          },
          code: /(?!defineComponent|defineNuxtComponent)/
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
    }]
})

function findImportSpecifier(importDecl: ImportDeclaration[], importedName: string, pkgNames: string | string[]) {
  const names = Array.isArray(pkgNames) ? pkgNames : [pkgNames]
  return importDecl.find(imp => names.includes(imp.source.value))?.specifiers.find((specifier) => {
    return specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === importedName
  })
}
