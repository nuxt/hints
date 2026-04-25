import type { HintsClientFunctions } from './rpc-types'

export function getRPC(): HintsClientFunctions | undefined {
  return globalThis.__nuxtHintsRpcBroadcast
}
