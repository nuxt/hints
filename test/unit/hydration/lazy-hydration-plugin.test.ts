/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { LazyLoadHintPlugin } from '../../../src/plugins/lazy-load'
import type { Plugin } from 'vite'
import type { ObjectHook } from 'unplugin'

const plugin = LazyLoadHintPlugin.vite() as Plugin
const transform = (plugin.transform as ObjectHook<any, any>).handler

describe('LazyLoadHintPlugin', () => { 
  describe('default imports', () => {
    it('should wrap a default import from a .vue file', async () => {
      const code = `import MyComp from './MyComp.vue'\nexport default { components: { MyComp } }`
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain('import __original_MyComp from \'./MyComp.vue\'')
      expect(result.code).toContain(
        `const MyComp = __wrapImportedComponent(__original_MyComp, 'MyComp', './MyComp.vue'`,
      )
    })

    it('should handle multiple default imports from different .vue files', async () => {
      const code = [
        `import CompA from './CompA.vue'`,
        `import CompB from './CompB.vue'`,
        `export default { components: { CompA, CompB } }`,
      ].join('\n')
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain('import __original_CompA from \'./CompA.vue\'')
      expect(result.code).toContain('import __original_CompB from \'./CompB.vue\'')
      expect(result.code).toContain(`__wrapImportedComponent(__original_CompA, 'CompA'`)
      expect(result.code).toContain(`__wrapImportedComponent(__original_CompB, 'CompB'`)
    })
  })

  describe('named imports', () => {
    it('should wrap a named import from a .vue file', async () => {
      const code = `import { MyComp } from './MyComp.vue'\nexport default { components: { MyComp } }`
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain('import { MyComp as __original_MyComp } from \'./MyComp.vue\'')
      expect(result.code).toContain(
        `const MyComp = __wrapImportedComponent(__original_MyComp, 'MyComp', './MyComp.vue'`,
      )
    })

    it('should wrap an aliased named import from a .vue file', async () => {
      const code = `import { default as AliasComp } from './MyComp.vue'\nexport default { components: { AliasComp } }`
      const result = await transform(code, '/src/Parent.vue')
      expect(result.code).toContain('__original_AliasComp')
      expect(result.code).toContain(
        `__wrapImportedComponent(__original_AliasComp, 'AliasComp', './MyComp.vue'`,
      )
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
      expect(result.code).toContain('__wrapMainComponent(_sfc_main,')
      expect(result.code).toContain(`componentName: 'ChildComp'`)
      expect(result.code).toContain(`importSource: './ChildComp.vue'`)
    })
  })

  describe('defineComponent setup injection', () => {
    it('should inject useLazyComponentTracking in defineComponent setup', async () => {
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
        "const ChildComp = __wrapImportedComponent(__original_ChildComp, 'ChildComp', './ChildComp.vue', '/src/Parent.ts')
        import { __wrapImportedComponent, __wrapMainComponent } from "@nuxt/hints/runtime/lazy-load/composables";
        import { useLazyComponentTracking } from "@nuxt/hints/runtime/lazy-load/composables";
        import { defineComponent } from 'vue'
        import __original_ChildComp from './ChildComp.vue'
        export default defineComponent({
          setup() {
        const lazyHydrationState = useLazyComponentTracking([{ componentName: 'ChildComp', importSource: './ChildComp.vue', importedBy: '/src/Parent.ts', rendered: false }]);

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
        "const ChildComp = __wrapImportedComponent(__original_ChildComp, 'ChildComp', './ChildComp.vue', '/src/Parent.ts')
        import { __wrapImportedComponent, __wrapMainComponent } from "@nuxt/hints/runtime/lazy-load/composables";
        import { useLazyComponentTracking } from "@nuxt/hints/runtime/lazy-load/composables";
        import { defineComponent } from 'vue'
        import __original_ChildComp from './ChildComp.vue'
        export default defineComponent({
          setup: () => {
        const lazyHydrationState = useLazyComponentTracking([{ componentName: 'ChildComp', importSource: './ChildComp.vue', importedBy: '/src/Parent.ts', rendered: false }]);

            return {}
          }
        })"
      `)
    })
  })
})
