import { addCustomTab, extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { addDevServerHandler, type Resolver } from '@nuxt/kit'
import { proxyRequest, eventHandler, getRequestHeader, setResponseHeader } from 'h3'
import { joinURL } from 'ufo'
import type { HintsClientFunctions, HintsServerFunctions } from './runtime/core/rpc-types'
import { RPC_NAMESPACE } from './runtime/core/rpc-types'
import { HINTS_ROUTE } from './runtime/core/server/types'
import {
  createHintsRouter,
  getHydrationMismatches,
  clearHydrationMismatches,
  getLazyLoadHints,
  clearLazyLoadHint,
  getHtmlValidateReports,
  clearHtmlValidateReport,
} from './devtools-handlers'

const DEVTOOLS_UI_ROUTE = '/__nuxt-hints'
const DEVTOOLS_UI_LOCAL_PORT = 3300

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver) {
  const clientPath = resolver.resolve('./client')
  const isProductionBuild = existsSync(clientPath)
  // the browser requests everything under the host `app.baseURL`
  const devtoolsUiRoute = joinURL(nuxt.options.app.baseURL, DEVTOOLS_UI_ROUTE)

  if (isProductionBuild) {
    serveBuiltClient(nuxt, clientPath, devtoolsUiRoute)
  }
  else {
    proxyLocalClient(devtoolsUiRoute)
  }

  addCustomTab({
    name: 'hints',
    title: 'Hints',
    icon: 'carbon:idea',
    category: 'analyze',
    view: {
      type: 'iframe',
      src: devtoolsUiRoute,
    },
  }, nuxt)

  addDevServerHandler({
    route: joinURL(nuxt.options.app.baseURL, HINTS_ROUTE),
    handler: createHintsRouter().handler,
  })

  onDevToolsInitialized(() => {
    const rpc = extendServerRpc<HintsClientFunctions, HintsServerFunctions>(RPC_NAMESPACE, {
      getHydrationMismatches,
      clearHydrationMismatches,
      getLazyLoadHints,
      clearLazyLoadHint,
      getHtmlValidateReports,
      clearHtmlValidateReport,
    })
    globalThis.__nuxtHintsRpcBroadcast = rpc.broadcast
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

function proxyLocalClient(route: string) {
  const target = `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`

  addDevServerHandler({
    route,
    handler: eventHandler(async (event) => {
      if (!isDocumentRequest(getRequestHeader(event, 'accept'))) {
        return proxyRequest(event, target + event.path)
      }
      const html = await fetch(target + event.path).then(res => res.text())
      setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
      return rewriteClientBase(html, route)
    }),
  })

  if (route !== DEVTOOLS_UI_ROUTE) {
    addDevServerHandler({
      route: DEVTOOLS_UI_ROUTE,
      handler: eventHandler(event => proxyRequest(event, target + event.path)),
    })
  }
}

function rewriteClientBase(html: string, route: string) {
  return route === DEVTOOLS_UI_ROUTE ? html : html.replaceAll(DEVTOOLS_UI_ROUTE, route)
}

function isDocumentRequest(accept: string | undefined) {
  return Boolean(accept?.includes('text/html'))
}
