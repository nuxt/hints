import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { basename, resolve } from 'node:path'
import { parseSync, type CallExpression, type ImportDeclaration, type ImportDefaultSpecifier, type ImportSpecifier } from 'oxc-parser'
import { createUnplugin } from 'unplugin'
import { distDir } from '../dirs'
import { findDefineComponentCalls } from './utils'

const INCLUDE_FILES = /\.(vue|tsx?|jsx?)$/
// Exclude node_moduels as users can have control over it
const EXCLUDE_NODE_MODULES = /node_modules/
const skipPath = normalizePath(resolve(distDir, 'runtime/lazy-load'))

export const LazyLoadHintPlugin = createUnplugin(() => {
  return {
    name: '@nuxt/hints:lazy-load-plugin',
    enforce: 'post',
    transform: {
      filter: {
        id: {
          include: INCLUDE_FILES,
          exclude: [skipPath, EXCLUDE_NODE_MODULES],
        },
      },
      handler(code, id) {
        const m = new MagicString(code)
        const { program } = parseSync(id, code)

        const imports = program.body.filter(
          (node): node is ImportDeclaration => node.type === 'ImportDeclaration',
        )

        const directComponentImports: {
          name: string
          source: string
          start: number
          end: number
          specifier: ImportDefaultSpecifier | ImportSpecifier
        }[] = []

        for (const importDecl of imports) {
          const source = importDecl.source.value
          // Skip if not a .vue file import
          if (!source.endsWith('.vue')) continue
          if (importDecl.importKind === 'type') continue

          for (const specifier of importDecl.specifiers ?? []) {
            if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportSpecifier') {
              const localName = specifier.local.name

              directComponentImports.push({
                name: localName,
                source,
                start: importDecl.start,
                end: importDecl.end,
                specifier,
              })
            }
          }
        }

        if (directComponentImports.length === 0) {
          return
        }

        // Inject the tracking wrapper import
        m.prepend(genImport(
          '@nuxt/hints/runtime/lazy-load/composables',
          ['__wrapImportedComponent', '__wrapMainComponent'],
        ) + '\n' + genImport(
          '@nuxt/hints/runtime/lazy-load/composables',
          ['useLazyComponentTracking'],
        ) + '\n')

        // For each direct import, wrap the component to track its usage
        // We do this after the imports by adding wrapper statements
        const wrapperStatements = directComponentImports
          .map((imp) => {
            const originalName = `__original_${imp.name}`
            // Rename the import to __original_X and create a wrapped version as X
            return `const ${imp.name} = __wrapImportedComponent(${originalName}, '${imp.name}', '${imp.source}', '${normalizePath(id)}')`
          })
          .join('\n')

        // Rename original imports by modifying the import specifiers
        for (const imp of directComponentImports) {
          const specifier = imp.specifier
          const localName = specifier.local.name
          const newName = `__original_${localName}`

          if (specifier.type === 'ImportDefaultSpecifier') {
            // For default imports: `import X from` → `import __original_X from`
            m.overwrite(
              specifier.local.start,
              specifier.local.end,
              newName,
            )
          }
          else if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name !== specifier.local.name) {
            // For aliased imports: `import { X as Y }` or `import { default as X }` → `import { X as __original_Y }` or `import { default as __original_X }`
            m.overwrite(
              specifier.local.start,
              specifier.local.end,
              newName,
            )
          }
          else {
            // For named imports: `import { X }` → `import { X as __original_X }`
            m.overwrite(
              specifier.local.start,
              specifier.local.end,
              `${localName} as ${newName}`,
            )
          }
        }

        // Inject useLazyComponentTracking in main component setup if applicable
        if (code.includes('_sfc_main')) {
          const wrappedComponents = directComponentImports.map((imp) => {
            if (imp.name.startsWith('__nuxt')) {
              // Auto imported components are using __nuxt_component_
              // See nuxt loadeer plugin
              return `{ componentName: '${basename(imp.source)}', importSource: '${imp.source}', importedBy: '${normalizePath(id)}', rendered: false }`
            }
            return `{ componentName: '${imp.name}', importSource: '${imp.source}', importedBy: '${normalizePath(id)}', rendered: false }`
          }).join(', ')
          m.replace('export default _sfc_main', `const _sfc_main_wrapped = __wrapMainComponent(_sfc_main, [${wrappedComponents}]);\nexport default _sfc_main_wrapped`)
        }
        const components = findDefineComponentCalls(program)

        if (components && components.length > 0) {
          for (const comp of components) {
            injectUseLazyComponentTrackingInComponentSetup(comp, m, directComponentImports, id)
          }
        }

        m.prepend(wrapperStatements + '\n')

        if (m.hasChanged()) {
          return {
            code: m.toString(),
            map: m.generateMap({ hires: true }),
          }
        }
      },
    },
  }
})

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function injectUseLazyComponentTrackingInComponentSetup(node: CallExpression, magicString: MagicString, directComponentImports: {
  name: string
  source: string
  start: number
  end: number
  specifier: ImportDefaultSpecifier | ImportSpecifier
}[], id: string) {
  if (node.arguments.length === 1) {
    const arg = node.arguments[0]
    if (arg?.type === 'ObjectExpression') {
      const properties = arg.properties
      const setupProp = properties.find(prop =>
        prop.type === 'Property'
        && prop.key.type === 'Identifier'
        && prop.key.name === 'setup',
      )
      if (setupProp && setupProp.type === 'Property') {
        const setupFunc = setupProp.value
        if (setupFunc.type === 'FunctionExpression' || setupFunc.type === 'ArrowFunctionExpression') {
          // Inject useLazyComponentTracking call at the start of the setup function body
          const insertPos = (setupFunc.body?.start ?? 0) + 1 // after {
          const componentsArray = directComponentImports.map((imp) => {
            return `{ componentName: '${imp.name}', importSource: '${imp.source}', importedBy: '${id}', rendered: false }`
          }).join(', ')
          const injectionCode = `\nconst lazyHydrationState = useLazyComponentTracking([${componentsArray}]);\n`
          magicString.appendLeft(insertPos, injectionCode)
        }
      }
    }
  }
}
