import type { H3Event } from 'h3'
import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { HydrationMismatchPayload } from './types'
import { useNitroApp } from 'nitropack/runtime'

const hydrationMistmatches: HydrationMismatchPayload[] = []

export default defineEventHandler((event) => {
  if (event.method === 'GET') {
    console.log('called')
    return getHandler()
  }
  else if (event.method === 'POST') {
    return postHandler(event)
  }

  throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
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
  nitro.hooks.callHook('hints:hydration:mismatch', payload)
  setResponseStatus(event, 201)
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
