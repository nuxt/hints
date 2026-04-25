import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { HydrationMismatchPayload } from './types'
import { getRPC } from '../core/rpc'

export const hydrationMismatches: HydrationMismatchPayload[] = []

export function getHydrationMismatches() {
  return { mismatches: hydrationMismatches }
}

export function clearHydrationMismatches(ids: string[]) {
  for (const id of ids) {
    const index = hydrationMismatches.findIndex(m => m.id === id)
    if (index !== -1) {
      hydrationMismatches.splice(index, 1)
    }
  }
  getRPC()?.onHydrationCleared(ids)
}

export const getHandler = defineEventHandler(() => getHydrationMismatches())

export const postHandler = defineEventHandler(async (event) => {
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
    const evicted = hydrationMismatches.shift()
    if (evicted) {
      getRPC()?.onHydrationCleared([evicted.id])
    }
  }
  getRPC()?.onHydrationMismatch(payload)
  setResponseStatus(event, 201)
  return payload
})

export const deleteHandler = defineEventHandler(async (event) => {
  const body = await readBody<{ id: string[] }>(event)
  if (!body || !Array.isArray(body.id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  clearHydrationMismatches(body.id)
  setResponseStatus(event, 204)
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertPayload(body: any): asserts body is Omit<HydrationMismatchPayload, 'id'> {
  if (
    !body
    || typeof body !== 'object'
    || (body.htmlPreHydration !== undefined && typeof body.htmlPreHydration !== 'string')
    || (body.htmlPostHydration !== undefined && typeof body.htmlPostHydration !== 'string')
    || typeof body.componentName !== 'string'
    || typeof body.fileLocation !== 'string'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
}
