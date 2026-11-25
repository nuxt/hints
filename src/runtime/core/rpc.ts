import type { HintsClientFunctions } from './rpc-types'
import { CLIENT_RPC_NAMES } from './rpc-types'

export type HintsBroadcast = (method: string, ...args: unknown[]) => void | Promise<void>

function wrapBroadcast(broadcast: HintsBroadcast): HintsClientFunctions {
  const fns: Record<string, (...args: unknown[]) => void> = {}
  for (const [method, wireName] of Object.entries(CLIENT_RPC_NAMES)) {
    fns[method] = (...args: unknown[]) => {
      try {
        const result = broadcast(wireName, ...args)
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          ;(result as Promise<unknown>).catch((e) => {
            console.debug(e)
          })
        }
      }
      catch (error) {
        console.debug(error)
      }
    }
  }
  return fns as unknown as HintsClientFunctions
}

export function getRPC(): HintsClientFunctions | undefined {
  const broadcast = globalThis.__nuxtHintsRpcBroadcast
  if (!broadcast) return undefined
  return wrapBroadcast(broadcast)
}
