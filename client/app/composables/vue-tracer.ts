import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import type { VNode } from 'vue'
import type { findTraceFromElement as _findTraceFromElement } from 'vite-plugin-vue-tracer/client/record'

export function findClosestTraceInfo(el: Element & { __vnode: VNode }) {
  const client = useDevtoolsClient().value
  if (!client || !client.host.inspector) {
    throw new Error('`findClosestWithTraceInfo` must be used when the devtools client is connected')
  }
  // @ts-ignore
  const { findTraceFromElement } = client.host.nuxt.$tracerRecord

  const traceInfo = (findTraceFromElement as typeof _findTraceFromElement)(el)
  if (!traceInfo && el.parentElement) {
    return findClosestTraceInfo(el.parentElement as unknown as Element & { __vnode: VNode })
  }
  return traceInfo
}
