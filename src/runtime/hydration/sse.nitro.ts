import { createEventStream, defineEventHandler } from 'h3'
import { useNitroApp } from 'nitropack/runtime'

export default defineEventHandler((event) => {
  const nitro = useNitroApp()
  const eventStream = createEventStream(event)

  const unsubs = [nitro.hooks.hook('hints:hydration:mismatch', (mismatch) => {
    eventStream.push({
      data: JSON.stringify(mismatch),
      event: 'hints:hydration:mismatch',
    })
  }), nitro.hooks.hook('hints:hydration:cleared', async (payload) => {
    eventStream.push({
      data: JSON.stringify(payload.id),
      event: 'hints:hydration:cleared',
    })
  })]

  eventStream.onClosed(async () => {
    unsubs.forEach(unsub => unsub())
    await eventStream.close()
  })

  return eventStream.send()
})
