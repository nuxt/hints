import type { NitroApp } from 'nitropack/types'
import type { BirpcGroup } from 'birpc'
import type { HintsClientRpc, HintsServerRpc } from '../../../rpc-types'

function getRpc(): BirpcGroup<HintsClientRpc, HintsServerRpc> | undefined {
  return (globalThis as Record<string, unknown>).__nuxtHintsRpc as BirpcGroup<HintsClientRpc, HintsServerRpc> | undefined
}

export default function (nitroApp: NitroApp) {
  nitroApp.hooks.hook('hints:hydration:mismatch', (mismatch) => {
    getRpc()?.broadcast.onHydrationMismatch.asEvent(mismatch)
  })

  nitroApp.hooks.hook('hints:hydration:cleared', (payload) => {
    getRpc()?.broadcast.onHydrationCleared.asEvent(payload.id)
  })

  nitroApp.hooks.hook('hints:lazy-load:report', (report) => {
    getRpc()?.broadcast.onLazyLoadReport.asEvent(report)
  })

  nitroApp.hooks.hook('hints:lazy-load:cleared', (payload) => {
    getRpc()?.broadcast.onLazyLoadCleared.asEvent(payload.id)
  })

  nitroApp.hooks.hook('hints:html-validate:report', (report) => {
    getRpc()?.broadcast.onHtmlValidateReport.asEvent(report)
  })

  nitroApp.hooks.hook('hints:html-validate:deleted', (id) => {
    getRpc()?.broadcast.onHtmlValidateDeleted.asEvent(id)
  })
}
