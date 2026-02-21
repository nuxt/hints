import { useNuxtApp } from '#imports'
import { describe, it, expect, beforeEach } from 'vitest'
import {
  useLazyComponentTracking,
  __wrapMainComponent,
  __wrapImportedComponent,
} from '../../../src/runtime/lazy-load/composables'
import type { DirectImportInfo } from '../../../src/runtime/lazy-load/schema'
import { defineComponent, h, type Component, type DefineComponent, type DefineSetupFnComponent, type SetupContext } from 'vue'

function makeComponent(setupFn?: (props: unknown, ctx: SetupContext) => unknown) {
  return defineComponent({
    setup: setupFn,
    render: () => h('div'),
  }) as unknown as DefineComponent
}

describe('lazy-load composables', () => {
  beforeEach(() => {
    const nuxtApp = useNuxtApp()
    // Reset lazy hydration state between tests
    delete nuxtApp.payload._lazyHydrationState
  })

  describe('useLazyComponentTracking', () => {
    it('should initialise state on first call', () => {
      const state = useLazyComponentTracking()

      expect(state).toBeDefined()
      expect(state.directImports).toBeInstanceOf(Map)
      expect(state.hasReported).toBe(false)
      expect(state.pageLoaded).toBe(false)
    })

    it('should return the same state on subsequent calls', () => {
      const first = useLazyComponentTracking()
      const second = useLazyComponentTracking()

      expect(first).toBe(second)
    })

    it('should register provided components', () => {
      const imports: DirectImportInfo[] = [
        { componentName: 'Foo', importSource: './Foo.vue', importedBy: 'page.vue', rendered: false },
        { componentName: 'Bar', importSource: './Bar.vue', importedBy: 'page.vue', rendered: false },
      ]

      const state = useLazyComponentTracking(imports)

      expect(state.directImports.size).toBe(2)
      expect(state.directImports.get('Foo')).toEqual(imports[0])
      expect(state.directImports.get('Bar')).toEqual(imports[1])
    })

    it('should merge components across multiple calls', () => {
      useLazyComponentTracking([
        { componentName: 'A', importSource: './A.vue', importedBy: 'page.vue', rendered: false },
      ])
      const state = useLazyComponentTracking([
        { componentName: 'B', importSource: './B.vue', importedBy: 'page.vue', rendered: false },
      ])

      expect(state.directImports.size).toBe(2)
      expect(state.directImports.has('A')).toBe(true)
      expect(state.directImports.has('B')).toBe(true)
    })

    it('should overwrite duplicate component names', () => {
      useLazyComponentTracking([
        { componentName: 'Foo', importSource: './Foo.vue', importedBy: 'page.vue', rendered: false },
      ])
      const state = useLazyComponentTracking([
        { componentName: 'Foo', importSource: './FooV2.vue', importedBy: 'layout.vue', rendered: true },
      ])

      expect(state.directImports.size).toBe(1)
      expect(state.directImports.get('Foo')!.importSource).toBe('./FooV2.vue')
    })
  })

  describe('__wrapMainComponent', () => {
    it('should register imports when setup is called', () => {
      const comp = makeComponent()
      const imports: DirectImportInfo[] = [
        { componentName: 'Child', importSource: './Child.vue', importedBy: 'page.vue', rendered: false },
      ]

      const wrapped = __wrapMainComponent(comp, imports)
      // Invoke setup to trigger registration
      wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)

      const nuxtApp = useNuxtApp()
      const state = nuxtApp.payload._lazyHydrationState
      expect(state).toBeDefined()
      expect(state.directImports.get('Child')).toEqual(imports[0])
    })

    it('should call original setup and return its value', () => {
      const setupReturn = { msg: 'hello' }
      const comp = makeComponent(() => setupReturn)
      const wrapped = __wrapMainComponent(comp, [])

      const result = wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)
      expect(result).toBe(setupReturn)
    })

    it('should return undefined when there is no original setup', () => {
      const comp = defineComponent({ render: () => h('div') }) as unknown as DefineComponent  
      const wrapped = __wrapMainComponent(comp, [])

      const result = wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)
      expect(result).toBeUndefined()
    })
  })

  describe('__wrapImportedComponent', () => {
    it('should register the component and mark it as rendered', () => {
      const comp = makeComponent()
      const wrapped = __wrapImportedComponent(comp, 'MyComp', './MyComp.vue', 'page.vue')

      wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)

      const nuxtApp = useNuxtApp()
      const state = nuxtApp.payload._lazyHydrationState
      expect(state).toBeDefined()
      expect(state.directImports.get('MyComp')).toEqual({
        componentName: 'MyComp',
        importSource: './MyComp.vue',
        importedBy: 'page.vue',
        rendered: true,
      })
    })

    it('should not overwrite existing entry but should mark rendered', () => {
      // Pre-register via main component tracking
      useLazyComponentTracking([
        { componentName: 'MyComp', importSource: './Original.vue', importedBy: 'page.vue', rendered: false },
      ])

      const comp = makeComponent()
      const wrapped = __wrapImportedComponent(comp, 'MyComp', './MyComp.vue', 'page.vue')
      wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)

      const nuxtApp = useNuxtApp()
      const state = nuxtApp.payload._lazyHydrationState
      // Should keep original import source since entry already existed
      expect(state.directImports.get('MyComp')!.importSource).toBe('./Original.vue')
      // But rendered should be true
      expect(state.directImports.get('MyComp')!.rendered).toBe(true)
    })

    it('should skip wrapping if component is already an AsyncComponentWrapper', () => {
      const asyncComp = defineComponent({
        name: 'AsyncComponentWrapper',
        setup: () => ({ wrapped: true }),
        render: () => h('div'),
      }) as unknown as DefineComponent

      const result = __wrapImportedComponent(asyncComp, 'Lazy', './Lazy.vue', 'page.vue')

      // Should return the same component without modifying setup
      expect(result).toBe(asyncComp)
      // Original setup should still work
      const setupResult = result.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)
      expect(setupResult).toEqual({ wrapped: true })
    })

    it('should call original setup and return its value', () => {
      const setupReturn = { count: 42 }
      const comp = makeComponent(() => setupReturn)
      const wrapped = __wrapImportedComponent(comp, 'Comp', './Comp.vue', 'page.vue')

      const result = wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)
      expect(result).toBe(setupReturn)
    })

    it('should return undefined when there is no original setup', () => {
      const comp = defineComponent({ render: () => h('div') }) as unknown as DefineComponent
      const wrapped = __wrapImportedComponent(comp, 'Comp', './Comp.vue', 'page.vue')

      const result = wrapped.setup!({}, { attrs: {}, slots: {}, emit: () => {}, expose: () => {} } as any)
      expect(result).toBeUndefined()
    })
  })
})
