import type { H3Event } from 'h3'
import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { HydrationMismatchPayload } from './types'
import { useNitroApp } from 'nitropack/runtime'

const hydrationMistmatches: HydrationMismatchPayload[] = []

export default defineEventHandler((event) => {
  switch (event.method) {
    case 'GET':
      return getHandler()
    case 'POST':
      return postHandler(event)
    case 'DELETE':
      return deleteHandler(event)
    default:
      throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }
})

function getHandler() {
  return {
    mismatches: hydrationMistmatches,
  }
}

async function postHandler(event: H3Event) {
  const body = await readBody<HydrationMismatchPayload>(event)
  assertPayload(body)
  const nitro = useNitroApp()
  const payload = { id: body.id, htmlPreHydration: body.htmlPreHydration, htmlPostHydration: body.htmlPostHydration, componentName: body.componentName, fileLocation: body.fileLocation }
  hydrationMistmatches.push(payload)
  if (hydrationMistmatches.length > 20) {
    hydrationMistmatches.shift()
  }
  nitro.hooks.callHook('hints:hydration:mismatch', payload)
  setResponseStatus(event, 201)
}

async function deleteHandler(event: H3Event) {
  const nitro = useNitroApp()
  const body = await readBody<{ id: string[] }>(event)
  if (!body || !Array.isArray(body.id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  for (const id of body.id) {
    const index = hydrationMistmatches.findIndex(m => m.id === id)
    if (index !== -1) {
      hydrationMistmatches.splice(index, 1)
    }
  }
  nitro.hooks.callHook('hints:hydration:cleared', { id: body.id })
  setResponseStatus(event, 204)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertPayload(body: any): asserts body is HydrationMismatchPayload {
  if (
    typeof body !== 'object'
    || typeof body.id !== 'string'
    || (body.htmlPreHydration !== undefined && typeof body.htmlPreHydration !== 'string')
    || (body.htmlPostHydration !== undefined && typeof body.htmlPostHydration !== 'string')
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
}
