import type { EventStream, H3Event } from 'h3'

export interface HintsApiContext {
  event: H3Event
  path: string
}

export interface HintsApiResult {
  handled: boolean
  status?: number
  body?: unknown
}

export interface HintsSseContext {
  eventStream: EventStream
  unsubscribers: (() => void)[]
}

export const HINTS_ROUTE = '/__nuxt_hints'
export const HINTS_SSE_ROUTE = '/__nuxt_hints/sse'
