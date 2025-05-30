import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

export function findClosestTraceInfo(el: Element) {
  const client = useDevtoolsClient().value
  if (!client || !client.host.inspector) {
    throw new Error('`findClosestWithTraceInfo` must be used when the devtools client is connected')
  }
  const { findTraceFromElement } = client.host.nuxt.__tracerRecord

  const traceInfo = findTraceFromElement(el)
  if (!traceInfo && el.parentElement) {
    return findClosestTraceInfo(el.parentElement)
  }
  return traceInfo
}

export function openElementSourceComponent(el: Element) {
  const client = useDevtoolsClient().value
  if (!client || !client.host.inspector) {
    throw new Error('`openElementSourceComponent` must be used when the devtools client is connected')
  }

  const { findTraceFromElement } = client.host.nuxt.__tracerRecord

  const traceInfo = findTraceFromElement(el)
  if (!traceInfo && el.parentElement) {
    return openElementSourceComponent(el.parentElement)
  }
  if (traceInfo) {
    client.devtools.rpc.openInEditor(traceInfo.filepath)
  }
  console.info('[@nuxt/hints] Source component not found for element', el)
}
