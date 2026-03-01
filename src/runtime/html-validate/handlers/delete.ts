import { createError, defineEventHandler, setResponseStatus } from 'h3'
import { storage } from '../storage'
import { useNitroApp } from 'nitropack/runtime'

export const deleteHandler = defineEventHandler(async (event) => {
  const nitro = useNitroApp()
  const id = event.context.params?.id
  if (typeof id === 'string') {
    await storage.removeItem(id)
    setResponseStatus(event, 204)
    nitro.hooks.callHook('hints:html-validate:deleted', id)
    return {}
  }
  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  })
})
