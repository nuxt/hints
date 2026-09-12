import { addCustomTab, extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
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
  const baseURL = nuxt.options.app?.baseURL || '/'
  const DEVTOOLS_UI8ROUTE = joinURL(baseURL, DEVTOOLS_UI_ROUTE)
 
  // Serve production-built client (used when package is published)
  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)
      const serveStatic = sirv(clientPath, { dev: true, single: false })
      const indexHtml = readFile(resolver.resolve('./client/index.html'), 'utf-8')
        .then(html => rewriteClientBase(html, DEVTOOLS_UI8ROUTE))

      server.middlewares.use(DEVTOOLS_UI8ROUTE, (req, res) => {
        const sendIndex = async () => {
          res.setHeader('Content-Type', 'text/html')
          res.statusCode = 200
          res.end(await indexHtml)
        }
        if (req.url === '/') {
          return sendIndex()
        }
        return serveStatic(req, res, sendIndex)
      })
    })
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    const proxyHandler = eventHandler(async (event) => {
      const target = 'http://localhost:' + DEVTOOLS_UI_LOCAL_PORT + DEVTOOLS_UI_ROUTE + event.path
      if (DEVTOOLS_UI8ROUTE !== DEVTOOLS_UI_ROUTE && getRequestHeader(event, 'accept')?.includes('text/html')) {
        const html = await fetch(target).then(r => r.text())
        setResponseHeader(event, 'Content-Type', 'text/html')
        return rewriteClientBase(html, DEVTOOLS_UI8ROUTE)
      }
      return proxyRequest(event, target)
    })

    addDevServerHandler({ route: DEVTOOLS_UI8ROUTE, handler: proxyHandler })
    if (DEVTOOLS_UI8ROUTE !== DEVTOOLS_UI_ROUTE) {
      addDevServerHandler({ route: DEVTOOLS_UI_ROUTE, handler: proxyHandler })
    }
  }

  addCustomTab({
    name: 'hints',
    title: 'Hints',
    icon: 'carbon:idea',
    category: 'analyze',
    view: {
      type: 'iframe',
      src: DEVTOOLS_UI8ROUTE,
    },
  }, nuxt)

  addDevServerHandler({
    route: joinURL(baseURL, HINTS_ROUTE),
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

function rewriteClientBase(html: string, uiRoute: string) {
  return uiRoute === DEVTOOLS_UI_ROUTE ? html : html.replaceAll(DEVTOOLS_UI_ROUTE, uiRoute)
}
