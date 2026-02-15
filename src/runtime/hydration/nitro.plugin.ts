import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { NitroApp } from 'nitropack/types'
import type { HydrationMismatchPayload } from './types'
import type { HintsSseContext } from '../core/server/types'

const hydrationMismatches: HydrationMismatchPayload[] = []

export default function (nitroApp: NitroApp) {
  const getHandler = defineEventHandler(() => {
    return {
      mismatches: hydrationMismatches,
    }
  })

  const postHandler = defineEventHandler(async (event) => {
    const body = await readBody<Omit<HydrationMismatchPayload, 'id'>>(event)
    assertPayload(body)
    const payload: HydrationMismatchPayload = {
      id: crypto.randomUUID(),
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
    return payload
  })

  const deleteHandler = defineEventHandler(async (event) => {
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
  })

  nitroApp.router.add('/__nuxt_hints/hydration', getHandler, 'get')
  nitroApp.router.add('/__nuxt_hints/hydration', postHandler, 'post')
  nitroApp.router.add('/__nuxt_hints/hydration', deleteHandler, 'delete')

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function assertPayload(body: any): asserts body is Omit<HydrationMismatchPayload, 'id'> {
    if (
      typeof body !== 'object'
      || (body.htmlPreHydration !== undefined && typeof body.htmlPreHydration !== 'string')
      || (body.htmlPostHydration !== undefined && typeof body.htmlPostHydration !== 'string')
      || typeof body.componentName !== 'string'
      || typeof body.fileLocation !== 'string'
    ) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
    }
  }
}
