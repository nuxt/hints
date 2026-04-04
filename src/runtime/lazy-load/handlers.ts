import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { ComponentLazyLoadData } from './schema'
import { ComponentLazyLoadDataSchema } from './schema'
import { parse, ValiError } from 'valibot'

export const lazyLoadData: ComponentLazyLoadData[] = []

let onReport: ((data: ComponentLazyLoadData) => void) | undefined
let onCleared: ((id: string) => void) | undefined

export function setLazyLoadNotify(callbacks: {
  onReport: (data: ComponentLazyLoadData) => void
  onCleared: (id: string) => void
}) {
  onReport = callbacks.onReport
  onCleared = callbacks.onCleared
}

export function getLazyLoadHints() {
  return lazyLoadData
}

export function clearLazyLoadHint(id: string) {
  const index = lazyLoadData.findIndex(item => item.id === id)
  if (index !== -1) {
    lazyLoadData.splice(index, 1)
  }
  onCleared?.(id)
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
  lazyLoadData.push(parsed)
  onReport?.(parsed)
  setResponseStatus(event, 201)
})

export const deleteHandler = defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }
  const index = lazyLoadData.findIndex(item => item.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }
  lazyLoadData.splice(index, 1)
  onCleared?.(id)
  setResponseStatus(event, 204)
})
