import { createError, defineEventHandler } from 'h3'
import { useNitroApp } from 'nitropack/runtime'
import type { HintsApiContext, HintsApiResult } from './types'

export default defineEventHandler(async (event) => {
  const nitro = useNitroApp()

  if (!event.context.params?._) {
    throw createError({ statusCode: 404 })
  }

  const path = event.context.params._
  const context: HintsApiContext = { event, path }
  const result: HintsApiResult = { handled: false }

  await nitro.hooks.callHook('hints:api:request', context, result)

  if (!result.handled) {
    throw createError({ statusCode: 400 })
  }

  return result.body
})
