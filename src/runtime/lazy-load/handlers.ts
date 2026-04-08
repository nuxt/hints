import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { ComponentLazyLoadData } from './schema'
import { ComponentLazyLoadDataSchema } from './schema'
import { parse, ValiError } from 'valibot'
import { getRPC } from '../core/rpc'

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

export const getHandler = defineEventHandler(() => getLazyLoadHints())

export const postHandler = defineEventHandler(async (event) => {
  const body = await readBody(event)
  let parsed: ComponentLazyLoadData
  try {
    parsed = parse(ComponentLazyLoadDataSchema, body)
  }
  catch (error) {
    if (error instanceof ValiError) {
      setResponseStatus(event, 400)
      return { error: 'Validation failed', message: error.message }
    }
    throw error
  }
  const index = lazyLoadData.findIndex(item => item.id === parsed.id)
  if (index === -1) {
    lazyLoadData.push(parsed)
    getRPC()?.onLazyLoadReport(parsed)
  }
  setResponseStatus(event, 201)
})

export const deleteHandler = defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }
  const hasEntry = lazyLoadData.some(item => item.id === id)
  if (!hasEntry) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }
  const next = lazyLoadData.filter(item => item.id !== id)
  lazyLoadData.length = 0
  lazyLoadData.push(...next)
  getRPC()?.onLazyLoadCleared(id)
  setResponseStatus(event, 204)
})
