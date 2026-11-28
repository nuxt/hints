import type { HydrationMismatchPayload } from './types'
import { getRPC } from '../core/rpc'
import { errorResponse, jsonResponse, readJsonBody } from '../core/server/types'

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

export function getHandler() {
  return jsonResponse(getHydrationMismatches())
}

export async function postHandler(request: Request) {
  const body = await readJsonBody<Omit<HydrationMismatchPayload, 'id'>>(request)
  if (!isPayload(body)) {
    return errorResponse(400, 'Invalid payload')
  }
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
  return jsonResponse(payload, { status: 201 })
}

export async function deleteHandler(request: Request) {
  const body = await readJsonBody<{ id: string[] }>(request)
  if (!body || !Array.isArray(body.id)) {
    return errorResponse(400, 'Invalid payload')
  }
  clearHydrationMismatches(body.id)
  return new Response(null, { status: 204 })
}

function isPayload(body: unknown): body is Omit<HydrationMismatchPayload, 'id'> {
  if (!body || typeof body !== 'object') return false
  const candidate = body as Record<string, unknown>
  return (candidate.htmlPreHydration === undefined || typeof candidate.htmlPreHydration === 'string')
    && (candidate.htmlPostHydration === undefined || typeof candidate.htmlPostHydration === 'string')
    && (candidate.componentName === undefined || typeof candidate.componentName === 'string')
    && typeof candidate.fileLocation === 'string'
}
