import { defineComponent, h, type DefineComponent } from 'vue'
import { useNuxtApp } from '#imports'

export interface DirectImportInfo {
  componentName: string
  importSource: string
  importedBy: string
  rendered: boolean
}

export interface LazyHydrationState {
  directImports: Map<string, DirectImportInfo>
  hasReported: boolean
  pageLoaded: boolean
}

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

  // Register direct imports
  for (const comp of components) {
    state.directImports.set(comp.componentName, comp)
  }

  return state
}

export function __wrapMainComponent(
  component: DefineComponent,
  imports: DirectImportInfo[] = [],
): DefineComponent {
  // Create a wrapper component that sets up lazy hydration tracking
  const originalSetup = component.setup

  component.setup = (props, ctx) => {
    useLazyComponentTracking(imports)
    return originalSetup ? originalSetup(props, ctx) : undefined
  }

  return component
}

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
  const wrapper = defineComponent({
    name: `LazyTracker_${componentName}`,
    setup(_, { slots, attrs }) {
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

      return () => h(component as DefineComponent, attrs, slots)
    },
  })

  return wrapper
}
