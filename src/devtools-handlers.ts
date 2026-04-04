import { createError, createRouter, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { HydrationMismatchPayload } from './runtime/hydration/types'
import type { ComponentLazyLoadData } from './runtime/lazy-load/schema'
import { ComponentLazyLoadDataSchema } from './runtime/lazy-load/schema'
import type { HtmlValidateReport } from './runtime/html-validate/types'
import type { HintsClientFunctions } from './runtime/core/rpc-types'
import { parse, ValiError } from 'valibot'

const hydrationMismatches: HydrationMismatchPayload[] = []
const lazyLoadData: ComponentLazyLoadData[] = []
const htmlValidateReports: HtmlValidateReport[] = []

let broadcast: HintsClientFunctions | undefined

/**
 * Set broadcast object from module. 
 */
export function setBroadcast(b: HintsClientFunctions) {
  broadcast = b
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
  broadcast?.onHydrationCleared(ids)
}

export function getLazyLoadHints() {
  return lazyLoadData
}

export function clearLazyLoadHint(id: string) {
  const index = lazyLoadData.findIndex(item => item.id === id)
  if (index !== -1) {
    lazyLoadData.splice(index, 1)
  }
  broadcast?.onLazyLoadCleared(id)
}

export function getHtmlValidateReports() {
  return htmlValidateReports
}

export function clearHtmlValidateReport(id: string) {
  const index = htmlValidateReports.findIndex(r => r.id === id)
  if (index !== -1) {
    htmlValidateReports.splice(index, 1)
  }
  broadcast?.onHtmlValidateDeleted(id)
}

// --- H3 Router ---

export const hintsRouter = createRouter()

// Hydration handlers
hintsRouter.get('/hydration', defineEventHandler(() => {
  return { mismatches: hydrationMismatches }
}))

hintsRouter.post('/hydration', defineEventHandler(async (event) => {
  const body = await readBody<Omit<HydrationMismatchPayload, 'id'>>(event)
  assertHydrationPayload(body)
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
  broadcast?.onHydrationMismatch(payload)
  setResponseStatus(event, 201)
  return payload
}))

hintsRouter.delete('/hydration', defineEventHandler(async (event) => {
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
  broadcast?.onHydrationCleared(body.id)
  setResponseStatus(event, 204)
}))

// Lazy-load handlers
hintsRouter.get('/lazy-load', defineEventHandler(() => {
  return lazyLoadData
}))

hintsRouter.post('/lazy-load', defineEventHandler(async (event) => {
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
  broadcast?.onLazyLoadReport(parsed)
  setResponseStatus(event, 201)
}))

hintsRouter.delete('/lazy-load/:id', defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID is required' })
  }
  const index = lazyLoadData.findIndex(item => item.id === id)
  if (index !== -1) {
    lazyLoadData.splice(index, 1)
  }
  else {
    throw createError({ statusCode: 404, message: 'Entry not found' })
  }
  broadcast?.onLazyLoadCleared(id)
  setResponseStatus(event, 204)
}))

// HTML validate handlers
hintsRouter.get('/html-validate', defineEventHandler(() => {
  return htmlValidateReports
}))

hintsRouter.post('/html-validate', defineEventHandler(async (event) => {
  const body = await readBody<HtmlValidateReport>(event)
  if (!body || typeof body.id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  if (!htmlValidateReports.some(r => r.id === body.id)) {
    htmlValidateReports.push(body)
    broadcast?.onHtmlValidateReport(body)
  }
  setResponseStatus(event, 201)
}))

hintsRouter.delete('/html-validate/:id', defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (typeof id !== 'string') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  const index = htmlValidateReports.findIndex(r => r.id === id)
  if (index !== -1) {
    htmlValidateReports.splice(index, 1)
  }
  broadcast?.onHtmlValidateDeleted(id)
  setResponseStatus(event, 204)
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function assertHydrationPayload(body: any): asserts body is Omit<HydrationMismatchPayload, 'id'> {
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
