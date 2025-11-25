/* eslint-disable @typescript-eslint/no-explicit-any */
import   { defineComponent as _defineComponent, type DefineComponent } from 'vue'

import { defineNuxtComponent as _defineNuxtComponent } from 'nuxt/app'
import { useHydrationCheck } from './composables'

export const defineNuxtComponent: typeof _defineComponent
  = function defineNuxtComponent(...args: any[]): any {
    const [options, key] = args
    const { setup } = options as DefineComponent

    options.setup = function (props: any, ctx: any) {
      useHydrationCheck()
      return setup ? setup(props, ctx) : undefined
    }

    return _defineNuxtComponent(options as any, key)
  }

export const defineComponent: typeof _defineComponent = function defineComponent(...args: any[]): any {
  const [options] = args
  if (typeof options === 'object' && options !== null) {
    const { setup } = options as DefineComponent
    options.setup = function (props: any, ctx: any) {
      useHydrationCheck()
      return setup ? setup(props, ctx) : undefined
    }
  }
  return _defineComponent(options as any)
}
