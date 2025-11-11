import { existsSync } from 'node:fs'
import type { Nuxt } from '@nuxt/schema'
import { addDevServerHandler, type Resolver } from '@nuxt/kit'
import { proxyRequest, eventHandler } from 'h3'

const DEVTOOLS_UI_ROUTE = '/__nuxt-hints'
const DEVTOOLS_UI_LOCAL_PORT = 3300

export function setupDevToolsUI(nuxt: Nuxt, resolver: Resolver) {
  const clientPath = resolver.resolve('./client')
  const isProductionBuild = existsSync(clientPath)

  // Serve production-built client (used when package is published)
  if (isProductionBuild) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = await import('sirv').then(r => r.default || r)
      server.middlewares.use(
        DEVTOOLS_UI_ROUTE,
        sirv(clientPath, { dev: true, single: true }),
      )
    })
  }
  // In local development, start a separate Nuxt Server and proxy to serve the client
  else {
    addDevServerHandler({
      route: DEVTOOLS_UI_ROUTE,
      handler: eventHandler((e) => {
        return proxyRequest(e, 'http://localhost:' + DEVTOOLS_UI_LOCAL_PORT + DEVTOOLS_UI_ROUTE + e.path)
      }),
    })
  }

  nuxt.hook('devtools:customTabs', (tabs) => {
    tabs.push({
      name: 'hints',
      title: 'Hints',
      icon: 'carbon:idea',
      category: 'analyze',
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })
}
