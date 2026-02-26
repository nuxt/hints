import { HINTS_SSE_ROUTE } from '../utils/routes'

export default defineNuxtPlugin(() => {
  const eventSource = useEventSource(HINTS_SSE_ROUTE, undefined, {
    autoReconnect: {
      retries: 5,
      onFailed() {
        console.error(new Error('[@nuxt/hints] Failed to connect to hints SSE after 5 attempts.'))
      },
    },
  })

  return {
    provide: {
      sse: eventSource,
    },
  }
})
