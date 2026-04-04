import type { NitroApp } from 'nitropack/types'
import type { HintsClientFunctions } from '../rpc-types'

function getRpcBroadcast(): HintsClientFunctions | undefined {
  return globalThis.__nuxtHintsRpcBroadcast
}

export default function (nitroApp: NitroApp) {
  nitroApp.hooks.hook('hints:hydration:mismatch', (mismatch) => {
    getRpcBroadcast()?.onHydrationMismatch(mismatch)
  })

  nitroApp.hooks.hook('hints:hydration:cleared', (payload) => {
    getRpcBroadcast()?.onHydrationCleared(payload.id)
  })

  nitroApp.hooks.hook('hints:lazy-load:report', (data) => {
    getRpcBroadcast()?.onLazyLoadReport(data)
  })

  nitroApp.hooks.hook('hints:lazy-load:cleared', (payload) => {
    getRpcBroadcast()?.onLazyLoadCleared(payload.id)
  })

  nitroApp.hooks.hook('hints:html-validate:report', (report) => {
    getRpcBroadcast()?.onHtmlValidateReport(report)
  })

  nitroApp.hooks.hook('hints:html-validate:deleted', (id) => {
    getRpcBroadcast()?.onHtmlValidateDeleted(id)
  })
}
