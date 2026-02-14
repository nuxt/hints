import { HINTS_SSE_ROUTE } from '../../../src/runtime/core/server/types'

export function useHintsSSE() {
  return useState('hints-sse', () => new EventSource(
    HINTS_SSE_ROUTE,
  ))
}
