import { genImport } from 'knitwork'
import MagicString from 'magic-string'
import { parse, resolve } from 'node:path'
import { parseSync, type CallExpression, type ImportDeclaration, type ImportDefaultSpecifier, type ImportSpecifier } from 'oxc-parser'
import { createUnplugin } from 'unplugin'
import { distDir } from '../dirs'
import { findDefineComponentCalls } from './utils'
import { useNuxt } from '@nuxt/kit'
import type { Component } from '@nuxt/schema'

interface DirectComponentImport {
  name: string
  source: string
  start: number
  end: number
  specifier: ImportDefaultSpecifier | ImportSpecifier
}

const INCLUDE_FILES = /\.(vue|tsx?|jsx?)$/
// Exclude node_moduels as users can have control over it
const EXCLUDE_NODE_MODULES = /node_modules/

const VITE_GLOB_RE = /^__glob_\d+_\d+$/
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

        const directComponentImports: DirectComponentImport[] = []

        for (const importDecl of imports) {
          const source = importDecl.source.value
          // Skip if not a .vue file import
          if (!source.endsWith('.vue')) continue
          if (importDecl.importKind === 'type') continue

          for (const specifier of importDecl.specifiers ?? []) {
            if (specifier.type === 'ImportDefaultSpecifier' || specifier.type === 'ImportSpecifier') {
              const localName = specifier.local.name

              // skip vite glob-generated imports
              // https://github.com/nuxt/hints/issues/262
              if (VITE_GLOB_RE.test(localName)) continue

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

        const importsInfo = genImportsInfo(directComponentImports, id, nuxtComponents)
        // Imported bindings are only read inside setup, after the whole module graph has evaluated,
        // so circular component imports never hit the TDZ (https://github.com/nuxt/hints/issues/388)
        const wrapStatements = genWrapStatements(directComponentImports, id, nuxtComponents)

        if (code.includes('_sfc_main')) {
          m.replace(
            'export default _sfc_main',
            `const _sfc_main_wrapped = __wrapMainComponent(_sfc_main, [${importsInfo}]);\nexport default _sfc_main_wrapped`,
          )
        }

        const components = findDefineComponentCalls(program)

        if (components && components.length > 0) {
          for (const comp of components) {
            injectUseLazyComponentTrackingInComponentSetup(comp, m, importsInfo, wrapStatements)
          }
        }

        if (!m.hasChanged()) {
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

        return {
          code: m.toString(),
          map: m.generateMap({ hires: true }),
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

function genImportsInfo(directComponentImports: DirectComponentImport[], id: string, nuxtComponents: Component[]): string {
  return directComponentImports.map((imp) => {
    const componentName = resolveComponentName(imp, nuxtComponents)
    return `{ componentName: '${componentName}', importSource: '${imp.source}', importedBy: '${normalizePath(id)}', rendered: false }`
  }).join(', ')
}

function genWrapStatements(directComponentImports: DirectComponentImport[], id: string, nuxtComponents: Component[]): string {
  return directComponentImports.map((imp) => {
    const componentName = resolveComponentName(imp, nuxtComponents)
    return `__wrapImportedComponent(${imp.name}, '${componentName}', '${imp.source}', '${normalizePath(id)}');`
  }).join('\n')
}

function injectUseLazyComponentTrackingInComponentSetup(node: CallExpression, magicString: MagicString, importsInfo: string, wrapStatements: string) {
  if (node.arguments.length !== 1) return

  const arg = node.arguments[0]
  if (arg?.type !== 'ObjectExpression') return

  const setupProp = arg.properties.find(prop =>
    prop.type === 'Property'
    && prop.key.type === 'Identifier'
    && prop.key.name === 'setup',
  )
  if (!setupProp || setupProp.type !== 'Property') return

  const setupFunc = setupProp.value
  if (setupFunc.type !== 'FunctionExpression' && setupFunc.type !== 'ArrowFunctionExpression') return
  // `setup: () => ({})` has no block to inject into
  if (setupFunc.body?.type !== 'BlockStatement') return

  // Inject tracking and wrapping at the start of the setup function body
  const insertPos = setupFunc.body.start + 1 // after {
  const injectionCode = `\nconst lazyHydrationState = useLazyComponentTracking([${importsInfo}]);\n${wrapStatements}\n`
  magicString.appendLeft(insertPos, injectionCode)
}
