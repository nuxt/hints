import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import type { HintsClientRpc, HintsServerRpc } from '../../../src/rpc-types'

const RPC_NAMESPACE = 'hints'

export default defineNuxtPlugin(() => {
  if (import.meta.test) return

  const nuxtApp = useNuxtApp()

  onDevtoolsClientConnected((client) => {
    client.devtools.extendClientRpc<HintsServerRpc, HintsClientRpc>(RPC_NAMESPACE, {
      onHydrationMismatch(mismatch) {
        nuxtApp.callHook('hints:rpc:hydration:mismatch', mismatch)
      },
      onHydrationCleared(ids) {
        nuxtApp.callHook('hints:rpc:hydration:cleared', ids)
      },
      onLazyLoadReport(report) {
        nuxtApp.callHook('hints:rpc:lazy-load:report', report)
      },
      onLazyLoadCleared(id) {
        nuxtApp.callHook('hints:rpc:lazy-load:cleared', id)
      },
      onHtmlValidateReport(report) {
        nuxtApp.callHook('hints:rpc:html-validate:report', report)
      },
      onHtmlValidateDeleted(id) {
        nuxtApp.callHook('hints:rpc:html-validate:deleted', id)
      },
    })
  })
})
