import { createEventStream, defineEventHandler } from 'h3'
import { useNitroApp } from 'nitropack/runtime'

export default defineEventHandler((event) => {
  const nitro = useNitroApp()
  const eventStream = createEventStream(event)

  const unsub = nitro.hooks.hook('hints:hydration:mismatch', (mismatch) => {
    eventStream.push(JSON.stringify(mismatch))
  })

  eventStream.onClosed(async () => {
    unsub()
    await eventStream.close()
  })

  return eventStream.send()
})
