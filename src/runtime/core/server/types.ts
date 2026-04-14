import type { EventHandler, H3Event } from 'h3'

export interface HintsApiContext {
  event: H3Event
  path: string
  handler?: EventHandler
}

export const HINTS_ROUTE = '/__nuxt_hints'
