import type { EventStreamMessage } from 'h3'
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

// prefer interface for extensibility
export interface HydrationMismatchResponse {
  mismatches: HydrationMismatchPayload[]
}

export interface HydrationDeleteSSE extends EventStreamMessage {
  event: 'hydration:cleared'
  // array of ids
  data: string
}

export interface HydrationNewSSE extends EventStreamMessage {
  event: 'hydration:mismatch'
  /**
   * Stringified HydrationMismatchPayload
   * @see HydrationMismatchPayload
   */
  data: string
}

export type HydrationSSEPayload = HydrationDeleteSSE | HydrationNewSSE
