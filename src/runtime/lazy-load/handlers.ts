import type { ComponentLazyLoadData } from './schema'
import { ComponentLazyLoadDataSchema } from './schema'
import { parse, ValiError } from 'valibot'
import { getRPC } from '../core/rpc'
import { errorResponse, jsonResponse, readJsonBody } from '../core/server/types'

export const lazyLoadData: ComponentLazyLoadData[] = []

export function getLazyLoadHints() {
  return lazyLoadData
}

export function clearLazyLoadHint(id: string) {
  const next = lazyLoadData.filter(item => item.id !== id)
  lazyLoadData.length = 0
  lazyLoadData.push(...next)
  getRPC()?.onLazyLoadCleared(id)
}

export function getHandler() {
  return jsonResponse(getLazyLoadHints())
}

export async function postHandler(request: Request) {
  const body = await readJsonBody(request)
  let parsed: ComponentLazyLoadData
  try {
    parsed = parse(ComponentLazyLoadDataSchema, body)
  }
  catch (error) {
    if (error instanceof ValiError) {
      return jsonResponse({ error: 'Validation failed', message: error.message }, { status: 400 })
    }
    throw error
  }
  const index = lazyLoadData.findIndex(item => item.id === parsed.id)
  if (index === -1) {
    lazyLoadData.push(parsed)
    getRPC()?.onLazyLoadReport(parsed)
  }
  return new Response(null, { status: 201 })
}

export function deleteHandler(_request: Request, id: string | undefined) {
  if (!id) {
    return errorResponse(400, 'ID is required')
  }
  const hasEntry = lazyLoadData.some(item => item.id === id)
  if (!hasEntry) {
    return errorResponse(404, 'Entry not found')
  }
  clearLazyLoadHint(id)
  return new Response(null, { status: 204 })
}
