import { ref as _ref, reactive as _reactive, shallowReactive as _shallowReactive, shallowRef as _shallowRef, getCurrentInstance } from 'vue'
import { tryUseNuxtApp } from '#app'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapWithWarning<Fn extends (...args: any[]) => any>(fn: Fn, name: string): Fn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (this: unknown, ...args: any[]) {
    const nuxtApp = tryUseNuxtApp()
    if (!nuxtApp && !getCurrentInstance()) {
      console.warn(`[@nuxt/hints] ${name}() called outside of setup() or without Nuxt app context. This may lead to Server side memory leaks.`)
    }
    return fn.call(this, ...args)
  } as Fn
}

export const ref = wrapWithWarning(_ref, 'ref')
export const reactive = wrapWithWarning(_reactive, 'reactive')
export const shallowReactive = wrapWithWarning(_shallowReactive, 'shallowReactive')
export const shallowRef = wrapWithWarning(_shallowRef, 'shallowRef')
