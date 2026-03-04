import type { HtmlValidateReport } from '../../../src/runtime/html-validate/types'
import { defineNuxtPlugin } from '#imports'
import { HTML_VALIDATE_ROUTE } from '../utils/routes'

export default defineNuxtPlugin(() => {
  if (import.meta.test || !useHintsFeature('htmlValidate')) return
  const nuxtApp = useNuxtApp()

  const { data: htmlValidateReports } = useLazyFetch<HtmlValidateReport[]>(new URL(HTML_VALIDATE_ROUTE, window.location.origin).href, {
    default: () => [],
    deep: true,
  })

  function htmlValidateReportHandler(event: MessageEvent) {
    try {
      const payload: HtmlValidateReport = JSON.parse(event.data)
      if (!htmlValidateReports.value.some(existing => existing.id === payload.id)) {
        htmlValidateReports.value = [...htmlValidateReports.value, payload]
      }
    }
    catch {
      console.warn('[hints] Ignoring malformed hints:html-validate:report event', event.data)
    }
  }

  function htmlValidateDeletedHandler(event: MessageEvent) {
    try {
      const deletedId = JSON.parse(event.data)
      htmlValidateReports.value = htmlValidateReports.value.filter(report => report.id !== deletedId)
    }
    catch {
      console.warn('[hints] Ignoring malformed hints:html-validate:deleted event', event.data)
    }
  }

  useEventListener(nuxtApp.$sse.eventSource, 'hints:html-validate:report', htmlValidateReportHandler)
  useEventListener(nuxtApp.$sse.eventSource, 'hints:html-validate:deleted', htmlValidateDeletedHandler)

  return {
    provide: {
      htmlValidateReports,
    },
  }
})
