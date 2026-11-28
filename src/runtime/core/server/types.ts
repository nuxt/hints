export const HINTS_ROUTE = '/__nuxt_hints'

export type HintsRequestHandler = (request: Request, path: string) => Response | Promise<Response>

export function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...init.headers },
  })
}

export function errorResponse(status: number, message: string): Response {
  return jsonResponse({ error: message, status }, { status })
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T | undefined> {
  try {
    return await request.json() as T
  }
  catch {
    return undefined
  }
}
