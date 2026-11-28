import { NUXT_DEVTOOLS_GROUP_ID, onDevtoolsReady } from '@nuxt/devtools-kit'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Nuxt, RequestEvent } from '@nuxt/schema'
import { addDevServerHandler, type Resolver } from '@nuxt/kit'
import { eventHandler, toWebRequest } from 'h3'
import { joinURL } from 'ufo'
import * as v from 'valibot'
import { RPC_NAMESPACE, SERVER_RPC_NAMES } from './runtime/core/rpc-types'
import { HINTS_ROUTE } from './runtime/core/server/types'
import {
  createHintsHandler,
  getHydrationMismatches,
  clearHydrationMismatches,
  getLazyLoadHints,
  clearLazyLoadHint,
  getHtmlValidateReports,
  clearHtmlValidateReport,
} from './devtools-handlers'

const DEVTOOLS_UI_ROUTE = '/__nuxt-hints'
const DEVTOOLS_UI_LOCAL_PORT = 3300

function addWebDevServerHandler(route: string, handle: (request: Request, url: URL) => Response | Promise<Response>) {
  addDevServerHandler({
    route,
    handler: {
      nuxt: (event: RequestEvent) => handle(event.req, event.url),
      nitro2: eventHandler((event) => {
        const request = toWebRequest(event)
        return handle(request, new URL(request.url))
      }),
    },
  })
}

function relativePath(url: URL, base: string) {
  const pathname = url.pathname
  if (base !== '/' && (pathname === base || pathname.startsWith(`${base}/`))) {
    return pathname.slice(base.length) || '/'
  }
  return pathname
}

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver) {
  const clientPath = resolver.resolve('./client')
  const isProductionBuild = existsSync(clientPath)
  // the browser requests everything under the host `app.baseURL`
  const devtoolsUiRoute = joinURL(nuxt.options.app.baseURL, DEVTOOLS_UI_ROUTE)
  const hintsApiRoute = joinURL(nuxt.options.app.baseURL, HINTS_ROUTE)

  if (isProductionBuild) {
    serveBuiltClient(nuxt, clientPath, devtoolsUiRoute)
  }
  else {
    proxyLocalClient(devtoolsUiRoute)
  }
  const handleHintsRequest = createHintsHandler()
  addWebDevServerHandler(
    joinURL(hintsApiRoute, '**'),
    (request, url) => handleHintsRequest(request, relativePath(url, hintsApiRoute)),
  )

  onDevtoolsReady((ctx) => {
    ctx.docks.register({
      id: 'nuxt-hints',
      title: 'Hints',
      icon: 'carbon:idea',
      type: 'iframe',
      url: devtoolsUiRoute,
      groupId: NUXT_DEVTOOLS_GROUP_ID,
      category: 'analyze',
    })

    const { rpc } = ctx.scope(RPC_NAMESPACE)

    rpc.register({
      name: SERVER_RPC_NAMES.getHydrationMismatches,
      type: 'query',
      handler: getHydrationMismatches,
      agent: {
        title: 'Hydration mismatches',
        description: 'List the hydration mismatches Nuxt Hints recorded in the running app: the component, its file, and the HTML before and after hydration. Call this before proposing a fix for a hydration warning.',
      },
    })
    rpc.register({
      name: SERVER_RPC_NAMES.clearHydrationMismatches,
      type: 'action',
      args: [v.array(v.string())],
      handler: clearHydrationMismatches,
      agent: {
        title: 'Clear hydration mismatches',
        description: 'Dismiss hydration mismatches by id once they are fixed or irrelevant, so they stop showing in the Hints panel.',
      },
    })
    rpc.register({
      name: SERVER_RPC_NAMES.getLazyLoadHints,
      type: 'query',
      handler: getLazyLoadHints,
      agent: {
        title: 'Lazy-load suggestions',
        description: 'List components that were statically imported but not rendered during SSR or hydration, per route, with where they are imported from. Use it to suggest the Lazy prefix or defineAsyncComponent.',
      },
    })
    rpc.register({
      name: SERVER_RPC_NAMES.clearLazyLoadHint,
      type: 'action',
      args: [v.string()],
      handler: clearLazyLoadHint,
      agent: {
        title: 'Clear lazy-load suggestion',
        description: 'Dismiss one lazy-load suggestion by id.',
      },
    })
    rpc.register({
      name: SERVER_RPC_NAMES.getHtmlValidateReports,
      type: 'query',
      handler: getHtmlValidateReports,
      agent: {
        title: 'HTML validation reports',
        description: 'List the html-validate reports for the pages the dev server rendered: the route, the formatted HTML and each rule violation with its line and column. Call this to find invalid markup in a page.',
      },
    })
    rpc.register({
      name: SERVER_RPC_NAMES.clearHtmlValidateReport,
      type: 'action',
      args: [v.string()],
      handler: clearHtmlValidateReport,
      agent: {
        title: 'Clear HTML validation report',
        description: 'Dismiss one HTML validation report by id.',
      },
    })

    globalThis.__nuxtHintsRpcBroadcast = (method, ...args) => rpc.broadcast({ method, args, event: true })
  }, nuxt)
}

function serveBuiltClient(nuxt: Nuxt, clientPath: string, route: string) {
  nuxt.hook('vite:serverCreated', async (server) => {
    const sirv = await import('sirv').then(r => r.default || r)
    const serveAssets = sirv(clientPath, { dev: true })
    let html: Promise<string> | undefined

    server.middlewares.use(route, async (req, res, next) => {
      if (!isDocumentRequest(req.headers.accept)) {
        return serveAssets(req, res, next)
      }
      html ??= readFile(join(clientPath, 'index.html'), 'utf8').then(html => rewriteClientBase(html, route))
      res.setHeader('content-type', 'text/html; charset=utf-8')
      res.end(await html)
    })
  })
}

/**
 * In local development the client is a separate `nuxi dev client` process
 * proxy it under the host app so the dock iframe stays same-origin.
 */
function proxyLocalClient(route: string) {
  const target = `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}`

  async function proxy(request: Request, url: URL, rewriteHtml: boolean) {
    const targetPath = rewriteHtml && route !== DEVTOOLS_UI_ROUTE
      ? url.pathname.replace(route, DEVTOOLS_UI_ROUTE)
      : url.pathname
    const headers = new Headers(request.headers)
    headers.delete('host')
    const upstream = await fetch(target + targetPath + url.search, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
      // @ts-expect-error undici option, needed to forward a streamed body
      duplex: 'half',
    })
    if (rewriteHtml && isDocumentRequest(request.headers.get('accept') ?? undefined)) {
      const html = rewriteClientBase(await upstream.text(), route)
      return new Response(html, {
        status: upstream.status,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
    const responseHeaders = new Headers(upstream.headers)
    responseHeaders.delete('content-encoding')
    responseHeaders.delete('content-length')
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders })
  }

  addWebDevServerHandler(joinURL(route, '**'), (request, url) => proxy(request, url, true))

  if (route !== DEVTOOLS_UI_ROUTE) {
    // the client's own absolute asset URLs are not prefixed with the host `app.baseURL`
    addWebDevServerHandler(joinURL(DEVTOOLS_UI_ROUTE, '**'), (request, url) => proxy(request, url, false))
  }
}

function rewriteClientBase(html: string, route: string) {
  return route === DEVTOOLS_UI_ROUTE ? html : html.replaceAll(DEVTOOLS_UI_ROUTE, route)
}

function isDocumentRequest(accept: string | undefined) {
  return Boolean(accept?.includes('text/html'))
}
