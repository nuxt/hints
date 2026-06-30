import { addCustomTab, extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { addDevServerHandler, type Resolver } from '@nuxt/kit'
import { proxyRequest, eventHandler } from 'h3'
import { joinURL } from 'ufo'
import type { HintsClientFunctions, HintsServerFunctions } from './runtime/core/rpc-types'
import { RPC_NAMESPACE } from './runtime/core/rpc-types'
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
const HINTS_API_ROUTE = '/__nuxt_hints'
const DEVTOOLS_UI_LOCAL_PORT = 3300

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver) {
  const clientPath = resolver.resolve('./client')
  const isProductionBuild = existsSync(clientPath)

  // Every dev endpoint must live under the host app's baseURL. The client
  // plugins reach the API with `$fetch` (which prepends `app.baseURL`) and the
  // devtools iframe loads the UI from the base-prefixed `src` below, so the bare
  // routes are never the ones the browser actually requests. Registering them
  // bare makes the requests miss and fall through to the host SSR renderer
  // (producing `[Vue Router warn]: No match found …`). `joinURL` is a no-op when
  // `baseURL` is "/", so the default setup is unaffected.
  const base = nuxt.options.app?.baseURL || '/'
  const devtoolsUiRoute = joinURL(base, DEVTOOLS_UI_ROUTE)
  const hintsApiRoute = joinURL(base, HINTS_API_ROUTE)

  // Serve production-built client (used when package is published)
  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)
      const serveAssets = sirv(clientPath, { dev: true })
      server.middlewares.use(devtoolsUiRoute, async (req, res, next) => {
        // The client is a prebuilt `ssr: false` Nuxt app with
        // `app.baseURL: '/__nuxt-hints'` compiled into its HTML (the inline
        // `__NUXT__` config + asset URLs). When the host app uses a non-root
        // baseURL we mount it at `devtoolsUiRoute`, so its baked references have
        // to be rewritten to match — otherwise the SPA's router and asset URLs
        // point at the bare path and the panel 404s. When `base` is "/",
        // `devtoolsUiRoute === DEVTOOLS_UI_ROUTE` and the rewrite is a no-op.
        //
        // Asset requests (anything with a file extension, e.g. `/_nuxt/*.js`)
        // are real files → hand them to sirv untouched. Everything else is an
        // SPA document/navigation → serve the entry HTML with the base
        // rewritten. (sirv on its own would serve the unrewritten `index.html`
        // for the mount root, which is the bug this avoids.)
        const path = (req.url || '/').split('?')[0] || '/'
        const isAsset = path !== '/' && /\.[a-z0-9]+$/i.test(path)
        if (isAsset) {
          return serveAssets(req, res, next)
        }
        try {
          const html = await readFile(join(clientPath, 'index.html'), 'utf8')
          res.setHeader('content-type', 'text/html;charset=utf-8')
          res.end(
            devtoolsUiRoute === DEVTOOLS_UI_ROUTE
              ? html
              : html.replaceAll(DEVTOOLS_UI_ROUTE, devtoolsUiRoute),
          )
        }
        catch {
          next()
        }
      })
    })
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    addDevServerHandler({
      route: devtoolsUiRoute,
      handler: eventHandler((e) => {
        return proxyRequest(e, 'http://localhost:' + DEVTOOLS_UI_LOCAL_PORT + DEVTOOLS_UI_ROUTE + e.path)
      }),
    })
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
    route: hintsApiRoute,
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
