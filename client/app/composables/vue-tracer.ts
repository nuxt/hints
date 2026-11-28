import { openInEditor, useDevtoolsHost } from './devtools'

export function findClosestTraceInfo(el: Element) {
  const host = useDevtoolsHost().value
  if (!host || !host.inspector) {
    throw new Error('`findClosestWithTraceInfo` must be used when the devtools client is connected')
  }
  const { findTraceFromElement } = host.nuxt.__tracerRecord

  const traceInfo = findTraceFromElement(el)
  if (!traceInfo && el.parentElement) {
    return findClosestTraceInfo(el.parentElement)
  }
  return traceInfo
}

export function openElementSourceComponent(el: Element) {
  const host = useDevtoolsHost().value
  if (!host || !host.inspector) {
    throw new Error('`openElementSourceComponent` must be used when the devtools client is connected')
  }

  const { findTraceFromElement } = host.nuxt.__tracerRecord

  const traceInfo = findTraceFromElement(el)
  if (!traceInfo && el.parentElement) {
    return openElementSourceComponent(el.parentElement)
  }
  if (traceInfo) {
    openInEditor(traceInfo.filepath)
    return
  }
  console.info('[@nuxt/hints] Source component not found for element', el)
}
