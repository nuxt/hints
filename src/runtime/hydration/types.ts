import type { ComponentInternalInstance, VNode } from 'vue'

export interface HydrationMismatchPayload {
  id: string
  componentName?: string
  fileLocation: string
  htmlPreHydration: string
  htmlPostHydration: string
}

export interface LocalHydrationMismatch extends HydrationMismatchPayload {
  instance: ComponentInternalInstance
  vnode: VNode
}

export interface HydrationMismatchResponse {
  mismatches: HydrationMismatchPayload[]
}
