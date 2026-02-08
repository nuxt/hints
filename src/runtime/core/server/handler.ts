import { createError, defineEventHandler } from 'h3'
import { useNitroApp } from 'nitropack/runtime'
import type { HintsApiContext } from './types'

export default defineEventHandler(async (event) => {
  const nitro = useNitroApp()

  if (!event.context.params?._) {
    throw createError({ statusCode: 404 })
  }

  const path = event.context.params._
  const context: HintsApiContext = { event, path, handler: undefined }

  await nitro.hooks.callHook('hints:api:request', context)

  if (context.handler) {
    return context.handler(event)
  }
})
