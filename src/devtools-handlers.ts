import type { HintsRequestHandler } from './runtime/core/server/types'
import { errorResponse } from './runtime/core/server/types'
import {
  getHydrationMismatches,
  clearHydrationMismatches,
  getHandler as hydrationGet,
  postHandler as hydrationPost,
  deleteHandler as hydrationDelete,
} from './runtime/hydration/handlers'
import {
  getLazyLoadHints,
  clearLazyLoadHint,
  getHandler as lazyLoadGet,
  postHandler as lazyLoadPost,
  deleteHandler as lazyLoadDelete,
} from './runtime/lazy-load/handlers'
import {
  getHtmlValidateReports,
  clearHtmlValidateReport,
  getHandler as htmlValidateGet,
  postHandler as htmlValidatePost,
  deleteHandler as htmlValidateDelete,
} from './runtime/html-validate/api-handlers'

export {
  getHydrationMismatches,
  clearHydrationMismatches,
  getLazyLoadHints,
  clearLazyLoadHint,
  getHtmlValidateReports,
  clearHtmlValidateReport,
}

type Method = 'GET' | 'POST' | 'DELETE'
type RouteHandler = (request: Request, id: string | undefined) => Response | Promise<Response>

const routes: Record<string, Partial<Record<Method, RouteHandler>>> = {
  'hydration': {
    GET: hydrationGet,
    POST: hydrationPost,
    DELETE: hydrationDelete,
  },
  'lazy-load': {
    GET: lazyLoadGet,
    POST: lazyLoadPost,
    DELETE: lazyLoadDelete,
  },
  'html-validate': {
    GET: htmlValidateGet,
    POST: htmlValidatePost,
    DELETE: htmlValidateDelete,
  },
}

/**
 * The Hints API, framework-neutral: `path` is relative to the mount route
 * (`/hydration`, `/lazy-load/:id`, ...). Unknown paths and methods answer 404/405
 * instead of falling through to the Nuxt renderer.
 */
export function createHintsHandler(): HintsRequestHandler {
  return async (request, path) => {
    const [resource = '', id, ...rest] = path.replace(/^\/+/, '').split('/')
    const route = routes[resource]
    // only `/resource` and `/resource/:id` exist
    if (!route || rest.length > 0) {
      return errorResponse(404, 'Not Found')
    }
    const handler = route[request.method.toUpperCase() as Method]
    if (!handler) {
      return errorResponse(405, 'Method Not Allowed')
    }
    return handler(request, id ? decodeURIComponent(id) : undefined)
  }
}
