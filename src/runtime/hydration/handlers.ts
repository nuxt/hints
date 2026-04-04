import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { HydrationMismatchPayload } from './types'

export const hydrationMismatches: HydrationMismatchPayload[] = []

let onMismatch: ((payload: HydrationMismatchPayload) => void) | undefined
let onCleared: ((ids: string[]) => void) | undefined

export function setHydrationNotify(callbacks: {
  onMismatch: (payload: HydrationMismatchPayload) => void
  onCleared: (ids: string[]) => void
}) {
  onMismatch = callbacks.onMismatch
  onCleared = callbacks.onCleared
}

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
  onCleared?.(ids)
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
    hydrationMismatches.shift()
  }
  onMismatch?.(payload)
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
    typeof body !== 'object'
    || (body.htmlPreHydration !== undefined && typeof body.htmlPreHydration !== 'string')
    || (body.htmlPostHydration !== undefined && typeof body.htmlPostHydration !== 'string')
    || typeof body.componentName !== 'string'
    || typeof body.fileLocation !== 'string'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
}
