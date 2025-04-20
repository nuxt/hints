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

export function openElementSourceComponent(el: Element & { __vnode: VNode }) {
  const client = useDevtoolsClient().value
   if (!client || !client.host.inspector) {
    throw new Error('`openElementSourceComponent` must be used when the devtools client is connected')
  }
  // @ts-ignore
  const { findTraceFromElement } = client.host.nuxt.$tracerRecord

  const traceInfo = (findTraceFromElement as typeof _findTraceFromElement)(el)
  if (!traceInfo && el.parentElement) {
    return openElementSourceComponent(el.parentElement as unknown as Element & { __vnode: VNode })
  }
  if(traceInfo) {
    client.devtools.rpc.openInEditor(traceInfo.filepath)
  }
  console.info('[@nuxt/hints] Source component not found for element', el)
}
