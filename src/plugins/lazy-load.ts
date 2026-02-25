import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { parse, resolve } from 'node:path'
import { parseSync, type CallExpression, type ImportDeclaration, type ImportDefaultSpecifier, type ImportSpecifier } from 'oxc-parser'
import { createUnplugin } from 'unplugin'
import { distDir } from '../dirs'
import { findDefineComponentCalls } from './utils'
import { useNuxt } from '@nuxt/kit'
import type { Component } from '@nuxt/schema'

const INCLUDE_FILES = /\.(vue|tsx?|jsx?)$/
// Exclude node_moduels as users can have control over it
const EXCLUDE_NODE_MODULES = /node_modules/
const skipPath = normalizePath(resolve(distDir, 'runtime/lazy-load'))

export const LazyLoadHintPlugin = createUnplugin(() => {
  const nuxt = useNuxt()

  let nuxtComponents: Component[] = nuxt.apps.default!.components
  nuxt.hook('components:extend', (extendedComponents) => {
    nuxtComponents = extendedComponents
  })

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
            const resolvedName = resolveComponentName(imp, nuxtComponents)
            // Rename the import to __original_X and create a wrapped version as X
            return `const ${imp.name} = __wrapImportedComponent(${originalName}, '${resolvedName}', '${imp.source}', '${normalizePath(id)}')`
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
            const componentName = resolveComponentName(imp, nuxtComponents)
            return `{ componentName: '${componentName}', importSource: '${imp.source}', importedBy: '${normalizePath(id)}', rendered: false }`
          }).join(', ')
          m.replace('export default _sfc_main', `const _sfc_main_wrapped = __wrapMainComponent(_sfc_main, [${wrappedComponents}]);\nexport default _sfc_main_wrapped`)
        }
        const components = findDefineComponentCalls(program)

        if (components && components.length > 0) {
          for (const comp of components) {
            injectUseLazyComponentTrackingInComponentSetup(comp, m, directComponentImports, id, nuxtComponents)
          }
        }

        const lastImport = imports[imports.length - 1]
        // See 
        if (lastImport) {
          m.appendRight(lastImport.end, '\n' + wrapperStatements)
        }
        else {
          m.prepend(wrapperStatements + '\n')
        }

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

function resolveComponentName(
  imp: { name: string, source: string },
  nuxtComponents: Component[],
): string {
  const component = nuxtComponents.find(c => c.filePath === imp.source)
  if (component) return component.pascalName
  return imp.name.startsWith('__nuxt') ? parse(imp.source).name : imp.name
}

function injectUseLazyComponentTrackingInComponentSetup(node: CallExpression, magicString: MagicString, directComponentImports: {
  name: string
  source: string
  start: number
  end: number
  specifier: ImportDefaultSpecifier | ImportSpecifier
}[], id: string, nuxtComponents: Component[]) {
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
            const componentName = resolveComponentName(imp, nuxtComponents)
            return `{ componentName: '${componentName}', importSource: '${imp.source}', importedBy: '${normalizePath(id)}', rendered: false }`
          }).join(', ')
          const injectionCode = `\nconst lazyHydrationState = useLazyComponentTracking([${componentsArray}]);\n`
          magicString.appendLeft(insertPos, injectionCode)
        }
      }
    }
  }
}
