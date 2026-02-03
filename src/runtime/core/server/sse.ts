import { createEventStream, defineEventHandler } from 'h3'
import { useNitroApp } from 'nitropack/runtime'
import type { HintsSseContext } from './types'

export default defineEventHandler((event) => {
  const nitro = useNitroApp()
  const eventStream = createEventStream(event)

  const context: HintsSseContext = {
    eventStream,
    unsubscribers: [],
  }

  // Allow features to register their SSE event handlers
  nitro.hooks.callHook('hints:sse:setup', context)

  eventStream.onClosed(async () => {
    context.unsubscribers.forEach(unsub => unsub())
    await eventStream.close()
  })

  return eventStream.send()
})
