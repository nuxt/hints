import type { DefineComponent } from 'vue'
import { useNuxtApp } from '#imports'
import type { DirectImportInfo } from './schema'

export function useLazyComponentTracking(components: DirectImportInfo[] = []) {
  const nuxtApp = useNuxtApp()
  if (!nuxtApp.payload._lazyHydrationState) {
    nuxtApp.payload._lazyHydrationState = {
      directImports: new Map(),
      hasReported: false,
      pageLoaded: false,
    }
  }

  const state = nuxtApp.payload._lazyHydrationState

  for (const comp of components) {
    state.directImports.set(comp.componentName, comp)
  }

  return state
}

/**
 * Wrap components definition like with defineComponent or defineNuxtComponent or just sfc exports
 */
export function __wrapMainComponent(
  component: DefineComponent,
  imports: DirectImportInfo[] = [],
): DefineComponent {
  const originalSetup = component.setup

  component.setup = (props, ctx) => {
    useLazyComponentTracking(imports)
    return originalSetup ? originalSetup(props, ctx) : undefined
  }

  return component
}

/**
 * Wrap imported components to track their usage.
 */
export function __wrapImportedComponent(
  component: DefineComponent,
  componentName: string,
  importSource: string,
  importedBy: string,
) {
  if (component && component.name === 'AsyncComponentWrapper') {
    // already wrapped by defineAsyncComponent
    return component
  }

  const originalSetup = component.setup

  component.setup = (props, ctx) => {
    const state = useLazyComponentTracking()
    if (state) {
      if (!state.directImports.has(componentName)) {
        state.directImports.set(componentName, {
          componentName,
          importSource,
          importedBy,
          rendered: false,
        })
      }

      const info = state.directImports.get(componentName)
      if (info) {
        info.rendered = true
      }
    }
    return originalSetup ? originalSetup(props, ctx) : undefined
  }

  return component
}
