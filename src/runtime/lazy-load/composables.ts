import type { DefineComponent } from 'vue'
import { useNuxtApp } from '#imports'
import { defu } from 'defu'
import type { DirectImportInfo } from './schema'

const WRAPPED_IMPORTERS = new WeakMap<DefineComponent, Set<string>>()

export function useLazyComponentTracking(components: DirectImportInfo[] = []) {
  const nuxtApp = useNuxtApp()
  if (!nuxtApp.payload.__hints?.lazyHydrationState) {
    nuxtApp.payload.__hints = defu(nuxtApp.payload.__hints, {
      lazyHydrationState: {
        directImports: new Map(),
        hasReported: false,
        pageLoaded: false,
      },
    })
  }

  const state = nuxtApp.payload.__hints.lazyHydrationState

  for (const comp of components) {
    const existing = state.directImports.get(comp.componentName)
    // a later importer of the same component must not reset its rendered state
    if (existing?.rendered && existing.importSource === comp.importSource) continue
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
 * must be called from the importer's setup, not at module scope to avoid circular import issues
 */
export function __wrapImportedComponent(
  component: DefineComponent,
  componentName: string,
  importSource: string,
  importedBy: string,
) {
  if (!isComponentLike(component)) {
    return component
  }

  if (component.name === 'AsyncComponentWrapper') {
    // already wrapped by defineAsyncComponent
    return component
  }

  const importers = WRAPPED_IMPORTERS.get(component) ?? new Set<string>()
  if (importers.has(importedBy)) {
    return component
  }
  importers.add(importedBy)
  WRAPPED_IMPORTERS.set(component, importers)

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

function isComponentLike(component: unknown): component is DefineComponent {
  return !!component && (typeof component === 'object' || typeof component === 'function')
}
