import type { HintsClientFunctions } from './rpc-types'

function wrapBroadcast(rpc: HintsClientFunctions): HintsClientFunctions {
  return new Proxy(rpc, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)
      if (typeof value !== 'function') return value
      return (...args: unknown[]) => {
        try {
          const result = (value as (...a: unknown[]) => unknown).apply(target, args)
          if (result && typeof (result as Promise<unknown>).catch === 'function') {
            ;(result as Promise<unknown>).catch((e) => {
              console.debug(e)
            })
          }
          return result
        }
        catch(error) {
          console.debug(error)
        }
      }
    },
  })
}

export function getRPC(): HintsClientFunctions | undefined {
  const rpc = globalThis.__nuxtHintsRpcBroadcast
  if (!rpc) return undefined
  return wrapBroadcast(rpc)
}
