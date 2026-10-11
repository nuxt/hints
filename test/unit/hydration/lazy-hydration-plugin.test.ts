/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest'
import type { Plugin } from 'vite'
import type { ObjectHook, UnpluginBuildContext, UnpluginContext } from 'unplugin'
import { parseSync, Visitor } from 'oxc-parser'
import { LazyLoadHintPlugin } from '../../../src/plugins/lazy-load'
import { useNuxt } from '@nuxt/kit'

vi.mock('@nuxt/kit', () => ({
  useNuxt: vi.fn(() => ({
    apps: {
      default: {
        components: [],
      },
    },
    hook: vi.fn(),
  })),
}))

const plugin = LazyLoadHintPlugin.vite() as Plugin
const transform = (plugin.transform as ObjectHook<any, any>).handler
const unpluginCtx: UnpluginBuildContext & UnpluginContext = {
  addWatchFile: vi.fn(),
  emitFile: vi.fn(),
  getWatchFiles: vi.fn(),
  parse: vi.fn(),
  getNativeBuildContext: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
}

function moduleScopeCode(code: string): string {
  const { program } = parseSync('out.ts', code)
  const ranges: [number, number][] = program.body
    .filter(node => node.type === 'ImportDeclaration')
    .map(node => [node.start, node.end])
  const collect = (node: { start: number, end: number }) => {
    ranges.push([node.start, node.end])
  }
  new Visitor({
    FunctionExpression: collect,
    ArrowFunctionExpression: collect,
    FunctionDeclaration: collect,
    Literal: collect,
  }).visit(program)

  let masked = code
  for (const [start, end] of ranges) {
    masked = masked.slice(0, start) + ' '.repeat(end - start) + masked.slice(end)
  }
  return masked
}

function scriptSetup(...imports: string[]): string {
  return [
    `import { defineComponent as _defineComponent } from 'vue'`,
    ...imports,
    `const _sfc_main = _defineComponent({`,
    `  setup(__props) {`,
    `    return {}`,
    `  }`,
    `})`,
    `export default _sfc_main`,
  ].join('\n')
}

describe('LazyLoadHintPlugin', () => {
  describe('default imports', () => {
    it('should keep the import untouched and wrap it inside setup', async () => {
      const code = scriptSetup(`import MyComp from './MyComp.vue'`)
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain(`import MyComp from './MyComp.vue'`)
      expect(result.code).not.toContain('__original_')
      expect(result.code).toContain(
        `__wrapImportedComponent(MyComp, 'MyComp', './MyComp.vue', '/src/Parent.vue');`,
      )
    })

    it('should handle multiple default imports from different .vue files', async () => {
      const code = scriptSetup(
        `import CompA from './CompA.vue'`,
        `import CompB from './CompB.vue'`,
      )
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain(`__wrapImportedComponent(CompA, 'CompA'`)
      expect(result.code).toContain(`__wrapImportedComponent(CompB, 'CompB'`)
    })
  })

  describe('named imports', () => {
    it('should wrap a named import from a .vue file', async () => {
      const code = scriptSetup(`import { MyComp } from './MyComp.vue'`)
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain(`import { MyComp } from './MyComp.vue'`)
      expect(result.code).toContain(`__wrapImportedComponent(MyComp, 'MyComp', './MyComp.vue'`)
    })

    it('should wrap an aliased named import from a .vue file', async () => {
      const code = scriptSetup(`import { default as AliasComp } from './MyComp.vue'`)
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain(`import { default as AliasComp } from './MyComp.vue'`)
      expect(result.code).toContain(`__wrapImportedComponent(AliasComp, 'AliasComp', './MyComp.vue'`)
    })
  })

  describe('_sfc_main wrapping', () => {
    it('should wrap _sfc_main with __wrapMainComponent when present', async () => {
      const code = [
        `import ChildComp from './ChildComp.vue'`,
        `const _sfc_main = {}`,
        `export default _sfc_main`,
      ].join('\n')
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain('const _sfc_main_wrapped = __wrapMainComponent(_sfc_main,')
      expect(result.code).toContain('export default _sfc_main_wrapped')
      expect(result.code).toContain(`componentName: 'ChildComp'`)
      expect(result.code).toContain(`importSource: './ChildComp.vue'`)
      expect(result.code).toMatchInlineSnapshot(`
        "import { __wrapImportedComponent, __wrapMainComponent } from "@nuxt/hints/runtime/lazy-load/composables";
        import { useLazyComponentTracking } from "@nuxt/hints/runtime/lazy-load/composables";
        import ChildComp from './ChildComp.vue'
        const _sfc_main = {}
        const _sfc_main_wrapped = __wrapMainComponent(_sfc_main, [{ componentName: 'ChildComp', importSource: './ChildComp.vue', importedBy: '/src/Parent.vue', rendered: false }]);
        export default _sfc_main_wrapped"
      `)
    })
  })

  describe('skipped imports', () => {
    it('should not transform type-only imports', async () => {
      const code = `import type MyComp from './MyComp.vue'\nexport default {}`
      const result = await transform(code, '/src/Parent.vue')
      expect(result).toBeUndefined()
    })

    it('should return undefined when there are no .vue imports at all', async () => {
      const code = `const x = 1\nexport default { x }`
      const result = await transform(code, '/src/Parent.vue')
      expect(result).toBeUndefined()
    })

    it('should return undefined when there is no setup to inject into', async () => {
      const code = `import MyComp from './MyComp.vue'\nexport default { components: { MyComp } }`
      const result = await transform(code, '/src/Parent.vue')
      expect(result).toBeUndefined()
    })

    it('should not inject into an arrow setup without a block body', async () => {
      const code = [
        `import { defineComponent } from 'vue'`,
        `import MyComp from './MyComp.vue'`,
        `export default defineComponent({ setup: () => ({ MyComp }) })`,
      ].join('\n')
      const result = await transform(code, '/src/Parent.ts')
      expect(result).toBeUndefined()
    })

    // https://github.com/nuxt/hints/issues/262
    it('should not transform Vite glob-generated imports (__glob_N_N pattern)', async () => {
      const code = [
        `import { default as __glob_0_0 } from './components/A.vue'`,
        `import { default as __glob_0_1 } from './components/B.vue'`,
        `const modules = { './components/A.vue': __glob_0_0, './components/B.vue': __glob_0_1 }`,
        `export default {}`,
      ].join('\n')
      const result = await transform(code, '/src/composables/useComponent.ts')
      expect(result).toBeUndefined()
    })

    it('should only wrap non-glob imports when mixed with glob-generated imports', async () => {
      const code = scriptSetup(
        `import { default as __glob_0_0 } from './components/A.vue'`,
        `import MyComp from './MyComp.vue'`,
      )
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain(`import { default as __glob_0_0 } from './components/A.vue'`)
      expect(result.code).not.toContain('__wrapImportedComponent(__glob_0_0')
      expect(result.code).toContain(`__wrapImportedComponent(MyComp, 'MyComp'`)
    })
  })

  describe('nuxt auto-imported components (__nuxt prefix)', () => {
    it('should use file basename as componentName for __nuxt prefixed imports in _sfc_main', async () => {
      const code = scriptSetup(`import __nuxt_component_0 from './ChildComp.vue'`)
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain(`componentName: 'ChildComp'`)
      expect(result.code).toContain(`importSource: './ChildComp.vue'`)
      expect(result.code).toContain(`__wrapImportedComponent(__nuxt_component_0, 'ChildComp'`)
    })

    it('should use file basename as componentName for __nuxt prefixed imports in defineComponent setup', async () => {
      const code = [
        `import { defineComponent } from 'vue'`,
        `import __nuxt_component_0 from './SomeWidget.vue'`,
        `export default defineComponent({`,
        `  setup() {`,
        `    return {}`,
        `  }`,
        `})`,
      ].join('\n')
      const result = await transform(code, '/src/Parent.ts')
      expect(result.code).toContain(`componentName: 'SomeWidget'`)
      expect(result.code).toContain('useLazyComponentTracking(')
    })
  })

  describe('nuxtComponents matching (pascalName)', () => {
    it('should use pascalName from nuxtComponents when component filePath matches', async () => {
      vi.mocked(useNuxt).mockReturnValueOnce({
        apps: {
          // @ts-expect-error partial mock
          default: {
            components: [
              {
                filePath: './MyWidget.vue',
                pascalName: 'MyWidgetPascal',
                kebabName: '',
                export: '',
                shortPath: '',
                chunkName: '',
                prefetch: false,
                preload: false,
              },
            ],
          },
        },
        hook: vi.fn(),
      })

      const { LazyLoadHintPlugin: PluginWithComponents } = await import('../../../src/plugins/lazy-load')
      const p = PluginWithComponents.vite() as Plugin
      const t = (p.transform as ObjectHook<any, any>).handler

      const code = scriptSetup(`import MyWidget from './MyWidget.vue'`)
      const result = await t.call(unpluginCtx, code, '/src/Parent.vue') as unknown as { code: string }
      expect(result.code).toContain(
        `__wrapImportedComponent(MyWidget, 'MyWidgetPascal', './MyWidget.vue'`,
      )
    })
  })

  // https://github.com/nuxt/hints/issues/388
  describe('circular imports (TDZ safety)', () => {
    it('should never read an imported component binding at module scope', async () => {
      const code = scriptSetup(`import TreeNode from './_TreeNode.vue'`)
      const result = await transform(code, '/src/_TreeChildren.vue')

      expect(result.code).toContain(`import TreeNode from './_TreeNode.vue'`)
      expect(result.code).toContain(`__wrapImportedComponent(TreeNode, 'TreeNode', './_TreeNode.vue', '/src/_TreeChildren.vue');`)
      // the binding may only be read inside functions, which run after the import cycle has resolved
      expect(moduleScopeCode(result.code)).not.toMatch(/\bTreeNode\b/)
    })

    it('should keep module-level usages of the import pointing at the original binding', async () => {
      const code = [
        `import __nuxt_component_0_client from './MyComp.client.vue'`,
        `import { createClientOnly } from '#app/components/client-only'`,
        `const __nuxt_component_0_client_wrapped = createClientOnly(__nuxt_component_0_client)`,
        `const _sfc_main = {}`,
        `export default _sfc_main`,
      ].join('\n')
      const result = await transform(code, '/src/Page.vue')
      expect(result.code).toContain(`import __nuxt_component_0_client from './MyComp.client.vue'`)
      expect(result.code).toContain('createClientOnly(__nuxt_component_0_client)')
      expect(result.code).not.toContain('const __nuxt_component_0_client =')
    })
  })

  describe('defineComponent setup injection', () => {
    it('should inject useLazyComponentTracking and wrapping in defineComponent setup', async () => {
      const code = [
        `import { defineComponent } from 'vue'`,
        `import ChildComp from './ChildComp.vue'`,
        `export default defineComponent({`,
        `  setup() {`,
        `    return {}`,
        `  }`,
        `})`,
      ].join('\n')
      const result = await transform(code, '/src/Parent.ts')
      expect(result.code).toContain('useLazyComponentTracking(')
      expect(result.code).toContain(`componentName: 'ChildComp'`)
      expect(result.code).toMatchInlineSnapshot(`
        "import { __wrapImportedComponent, __wrapMainComponent } from "@nuxt/hints/runtime/lazy-load/composables";
        import { useLazyComponentTracking } from "@nuxt/hints/runtime/lazy-load/composables";
        import { defineComponent } from 'vue'
        import ChildComp from './ChildComp.vue'
        export default defineComponent({
          setup() {
        const lazyHydrationState = useLazyComponentTracking([{ componentName: 'ChildComp', importSource: './ChildComp.vue', importedBy: '/src/Parent.ts', rendered: false }]);
        __wrapImportedComponent(ChildComp, 'ChildComp', './ChildComp.vue', '/src/Parent.ts');

            return {}
          }
        })"
      `)
    })

    it('should inject useLazyComponentTracking in arrow function setup', async () => {
      const code = [
        `import { defineComponent } from 'vue'`,
        `import ChildComp from './ChildComp.vue'`,
        `export default defineComponent({`,
        `  setup: () => {`,
        `    return {}`,
        `  }`,
        `})`,
      ].join('\n')
      const result = await transform(code, '/src/Parent.ts')
      expect(result.code).toContain('useLazyComponentTracking(')
      expect(result.code).toMatchInlineSnapshot(`
        "import { __wrapImportedComponent, __wrapMainComponent } from "@nuxt/hints/runtime/lazy-load/composables";
        import { useLazyComponentTracking } from "@nuxt/hints/runtime/lazy-load/composables";
        import { defineComponent } from 'vue'
        import ChildComp from './ChildComp.vue'
        export default defineComponent({
          setup: () => {
        const lazyHydrationState = useLazyComponentTracking([{ componentName: 'ChildComp', importSource: './ChildComp.vue', importedBy: '/src/Parent.ts', rendered: false }]);
        __wrapImportedComponent(ChildComp, 'ChildComp', './ChildComp.vue', '/src/Parent.ts');

            return {}
          }
        })"
      `)
    })
  })
})
