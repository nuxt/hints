import type { NuxtDevtoolsHostClient } from '@nuxt/devtools-kit/types'
import type { DevToolsRpcClient } from '@vitejs/devtools-kit/client'
import { getDevToolsRpcClient } from '@vitejs/devtools-kit/client'
import { computed, shallowRef } from 'vue'
import { RPC_NAMESPACE } from '../../../src/runtime/core/rpc-types'

export type HintsRpc = ReturnType<DevToolsRpcClient['scope']> extends infer S ? S extends { rpc: infer R } ? R : never : never
export type HostClient = NuxtDevtoolsHostClient

const kit = shallowRef<DevToolsRpcClient>()
const host = shallowRef<NuxtDevtoolsHostClient>()
let started = false

type HostWindow = Window & { __NUXT_DEVTOOLS_HOST__?: NuxtDevtoolsHostClient }

function readHost(): NuxtDevtoolsHostClient | undefined {
  const candidates: (Window | undefined)[] = []
  try {
    // the app window is usually the direct parent; older layouts nested the dock once more
    candidates.push(window.parent, window.parent?.parent)
  }
  catch {
    // cross-origin parent: no host client reachable
  }
  for (const candidate of candidates) {
    try {
      const client = (candidate as HostWindow | undefined)?.__NUXT_DEVTOOLS_HOST__
      if (client?.nuxt) return client
    }
    catch {
      // cross-origin access
    }
  }
  return undefined
}

function start() {
  if (started || import.meta.server) return
  started = true

  getDevToolsRpcClient().then((client) => {
    kit.value = client
  }).catch((error) => {
    console.warn('[@nuxt/hints] Could not connect to the DevTools RPC', error)
  })

  const poll = () => {
    const client = readHost()
    if (client) {
      host.value = client
      return
    }
    setTimeout(poll, 100)
  }
  poll()
}

/** The connected Vite DevTools RPC client, `undefined` until the connection is up. */
export function useDevtoolsKit() {
  start()
  return kit
}

/** The Nuxt DevTools host client of the user's app, `undefined` until it is reachable. */
export function useDevtoolsHost() {
  start()
  return host
}

/** The Hints RPC scope: `call('get-hydration-mismatches')`, `register(...)`. */
export function useHintsRpc() {
  start()
  return computed<HintsRpc | undefined>(() => kit.value?.scope(RPC_NAMESPACE).rpc)
}

/** The window the user's app runs in, for overlays and measurements. */
export function useHostWindow(): Window {
  try {
    return window.parent?.parent || window.parent || window
  }
  catch {
    return window
  }
}

/**
 * Open a file in the user's editor through Nuxt DevTools' own server RPC
 * (`nuxt:devtools:openInEditor`).
 */
export async function openInEditor(filepath: string) {
  const client = kit.value
  if (!client) {
    console.warn('[@nuxt/hints] DevTools RPC is not connected, cannot open', filepath)
    return false
  }
  return client.call('nuxt:devtools:openInEditor', filepath) as Promise<boolean>
}
