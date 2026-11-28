import type { HtmlValidateReport } from './types'
import { getRPC } from '../core/rpc'
import { errorResponse, jsonResponse, readJsonBody } from '../core/server/types'

export const htmlValidateReports: HtmlValidateReport[] = []

export function storeHtmlValidateReport(report: HtmlValidateReport) {
  if (htmlValidateReports.some(existing => existing.id === report.id)) {
    return false
  }
  htmlValidateReports.push(report)
  getRPC()?.onHtmlValidateReport(report)
  return true
}

export function getHtmlValidateReports() {
  return htmlValidateReports
}

export function clearHtmlValidateReport(id: string) {
  const index = htmlValidateReports.findIndex(r => r.id === id)
  if (index !== -1) {
    htmlValidateReports.splice(index, 1)
  }
  getRPC()?.onHtmlValidateDeleted(id)
}

export function getHandler() {
  return jsonResponse(getHtmlValidateReports())
}

export async function postHandler(request: Request) {
  const body = await readJsonBody<HtmlValidateReport>(request)
  if (!body || typeof body.id !== 'string') {
    return errorResponse(400, 'Invalid payload')
  }
  storeHtmlValidateReport(body)
  return new Response(null, { status: 201 })
}

export function deleteHandler(_request: Request, id: string | undefined) {
  if (typeof id !== 'string' || !id) {
    return errorResponse(404, 'Not Found')
  }
  clearHtmlValidateReport(id)
  return new Response(null, { status: 204 })
}
