/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'
import { InjectHydrationPlugin } from '../../../src/plugins/hydration'
import { genImport } from 'knitwork'
import type { Plugin } from 'vite'
import type { ObjectHook } from 'unplugin'

const plugins = InjectHydrationPlugin.vite() as Plugin[]

const modifyImportPluginTransform = (plugins.find(p => p.name === '@nuxt/hints:modify-hydration-composable-import')!.transform as ObjectHook<any, any>)!.handler
const injectComposablePluginTransform = (plugins.find(p => p.name === '@nuxt/hints:inject-hydration-composable')!.transform as ObjectHook<any, any>)!.handler

const importDefineComponent = genImport(
  '@nuxt/hints/runtime/hydration/component',
  ['defineComponent'],
)

const importDefineNuxtComponent = genImport(
  '@nuxt/hints/runtime/hydration/component',
  ['defineNuxtComponent'],
)

const exportDefineComponent = `
export default defineComponent({
  name: 'MyComponent'
})
`

const exportDefineNuxtComponent = `
export default defineNuxtComponent({
  name: 'MyNuxtComponent'
})
`

const vueCompiledFile = `
/* Analyzed bindings: {
  "ref": "setup-const",
  "msg": "setup-ref"
} */
import { ref } from 'vue'


const __sfc__ = {
  __name: 'App',
  setup(__props, { expose: __expose }) {
  __expose();

const msg = ref('Hello World!')

const __returned__ = { msg, ref }
Object.defineProperty(__returned__, '__isScriptSetup', { enumerable: false, value: true })
return __returned__
}

};
import { toDisplayString as _toDisplayString, createElementVNode as _createElementVNode, vModelText as _vModelText, withDirectives as _withDirectives, Fragment as _Fragment, openBlock as _openBlock, createElementBlock as _createElementBlock } from "vue"
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (_openBlock(), _createElementBlock(_Fragment, null, [
    _createElementVNode("h1", null, _toDisplayString($setup.msg), 1 /* TEXT */),
    _withDirectives(_createElementVNode("input", {
      "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => (($setup.msg) = $event))
    }, null, 512 /* NEED_PATCH */), [
      [_vModelText, $setup.msg]
    ])
  ], 64 /* STABLE_FRAGMENT */))
}
__sfc__.render = render
__sfc__.__file = "src/App.vue"
export default __sfc__
`

describe('InjectHydrationPlugin', () => {
  describe('modify-hydration-composable-import', () => {
    it('should replace defineComponent import from vue', async () => {
      const code = `import { defineComponent } from 'vue'\n${exportDefineComponent}`
      const result = await modifyImportPluginTransform(code, 'test.ts')
      expect(result.code).toContain(importDefineComponent.trim())
      expect(result.code).not.toContain('import { defineComponent } from \'vue\'')
    })

    it('should replace defineNuxtComponent import from #app', async () => {
      const code = `import { defineNuxtComponent } from '#app'\n${exportDefineNuxtComponent}`
      const result = await modifyImportPluginTransform(code, 'test.ts')
      expect(result.code).toContain(importDefineNuxtComponent.trim())
      expect(result.code).not.toContain('import { defineNuxtComponent } from \'#app\'')
    })

    it('should replace defineNuxtComponent import from #imports', async () => {
      const code = `import { defineNuxtComponent } from '#imports'\n${exportDefineNuxtComponent}`
      const result = await modifyImportPluginTransform(code, 'test.ts')
      expect(result.code).toContain(importDefineNuxtComponent.trim())
      expect(result.code).not.toContain('import { defineNuxtComponent } from \'#imports\'')
    })

    it('should inject import if defineComponent is used but not imported', async () => {
      const code = `${exportDefineComponent}`
      const result = await modifyImportPluginTransform(code, 'test.ts')
      expect(result.code).toContain(importDefineComponent.trim())
    })

    it('should not replace other imports', async () => {
      const code = `import { ref } from 'vue'\nexport default {}`
      const result = await modifyImportPluginTransform(code, 'test.ts')
      expect(result).toBe(undefined)
    })
  })

  describe('inject-hydration-composable', () => {
    it('should wrap default export with defineComponent in vue files', async () => {
      const result = await injectComposablePluginTransform(vueCompiledFile, 'App.vue')
      expect(result.code).toContain(importDefineComponent.trim())
      expect(result.code).toContain('export default defineComponent(__sfc__)')
    })
  })
})
