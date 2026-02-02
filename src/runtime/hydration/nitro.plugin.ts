import type { H3Event } from 'h3'
import { createError, readBody, setResponseStatus, sendError } from 'h3'
import type { NitroApp } from 'nitropack/types'
import type { HydrationMismatchPayload } from './types'
import type { HintsApiContext, HintsApiResult, HintsSseContext } from '../core/server/types'

const hydrationMismatches: HydrationMismatchPayload[] = []

export default function (nitroApp: NitroApp) {
  // Register API handler for hydration feature
  nitroApp.hooks.hook('hints:api:request', async (context: HintsApiContext, result: HintsApiResult) => {
    if (context.path !== 'hydration') {
      return
    }
    result.handled = true

    switch (context.event.method) {
      case 'GET':
        result.body = getHandler()
        break
      case 'POST':
        await postHandler(context.event, nitroApp)
        setResponseStatus(context.event, 201)
        break
      case 'DELETE':
        await deleteHandler(context.event, nitroApp)
        setResponseStatus(context.event, 204)
        break
      default:
        await sendError(context.event, createError({ statusCode: 405, statusMessage: 'Method Not Allowed' }))
    }
  })

  // Register SSE event handlers for hydration
  nitroApp.hooks.hook('hints:sse:setup', (context: HintsSseContext) => {
    context.unsubscribers.push(
      nitroApp.hooks.hook('hints:hydration:mismatch', (mismatch) => {
        context.eventStream.push({
          data: JSON.stringify(mismatch),
          event: 'hints:hydration:mismatch',
        })
      }),
      nitroApp.hooks.hook('hints:hydration:cleared', (payload) => {
        context.eventStream.push({
          data: JSON.stringify(payload.id),
          event: 'hints:hydration:cleared',
        })
      }),
    )
  })
}

function getHandler() {
  return {
    mismatches: hydrationMismatches,
  }
}

async function postHandler(event: H3Event, nitroApp: NitroApp) {
  const body = await readBody<HydrationMismatchPayload>(event)
  assertPayload(body)

  const payload: HydrationMismatchPayload = {
    id: body.id,
    htmlPreHydration: body.htmlPreHydration,
    htmlPostHydration: body.htmlPostHydration,
    componentName: body.componentName,
    fileLocation: body.fileLocation,
  }

  hydrationMismatches.push(payload)
  if (hydrationMismatches.length > 20) {
    hydrationMismatches.shift()
  }

  nitroApp.hooks.callHook('hints:hydration:mismatch', payload)
  setResponseStatus(event, 201)
}

async function deleteHandler(event: H3Event, nitroApp: NitroApp) {
  const body = await readBody<{ id: string[] }>(event)

  if (!body || !Array.isArray(body.id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }

  for (const id of body.id) {
    const index = hydrationMismatches.findIndex(m => m.id === id)
    if (index !== -1) {
      hydrationMismatches.splice(index, 1)
    }
  }

  nitroApp.hooks.callHook('hints:hydration:cleared', { id: body.id })
  setResponseStatus(event, 204)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertPayload(body: any): asserts body is HydrationMismatchPayload {
  if (
    typeof body !== 'object'
    || typeof body.id !== 'string'
    || (body.htmlPreHydration !== undefined && typeof body.htmlPreHydration !== 'string')
    || (body.htmlPostHydration !== undefined && typeof body.htmlPostHydration !== 'string')
    || typeof body.componentName !== 'string'
    || typeof body.fileLocation !== 'string'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
}
