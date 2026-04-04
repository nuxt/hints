import { createError, defineEventHandler, readBody, setResponseStatus } from 'h3'
import type { HtmlValidateReport } from './types'

export const htmlValidateReports: HtmlValidateReport[] = []

let onReport: ((report: HtmlValidateReport) => void) | undefined
let onDeleted: ((id: string) => void) | undefined

export function setHtmlValidateNotify(callbacks: {
  onReport: (report: HtmlValidateReport) => void
  onDeleted: (id: string) => void
}) {
  onReport = callbacks.onReport
  onDeleted = callbacks.onDeleted
}

export function getHtmlValidateReports() {
  return htmlValidateReports
}

export function clearHtmlValidateReport(id: string) {
  const index = htmlValidateReports.findIndex(r => r.id === id)
  if (index !== -1) {
    htmlValidateReports.splice(index, 1)
  }
  onDeleted?.(id)
}

export const getHandler = defineEventHandler(() => getHtmlValidateReports())

export const postHandler = defineEventHandler(async (event) => {
  const body = await readBody<HtmlValidateReport>(event)
  if (!body || typeof body.id !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid payload' })
  }
  if (!htmlValidateReports.some(r => r.id === body.id)) {
    htmlValidateReports.push(body)
    onReport?.(body)
  }
  setResponseStatus(event, 201)
})

export const deleteHandler = defineEventHandler(async (event) => {
  const id = event.context.params?.id
  if (typeof id !== 'string') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }
  clearHtmlValidateReport(id)
  setResponseStatus(event, 204)
})
