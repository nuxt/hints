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

  nuxtApp.hook('hints:rpc:html-validate:report', (report) => {
    if (!htmlValidateReports.value.some(existing => existing.id === report.id)) {
      htmlValidateReports.value = [...htmlValidateReports.value, report]
    }
  })

  nuxtApp.hook('hints:rpc:html-validate:deleted', (deletedId) => {
    htmlValidateReports.value = htmlValidateReports.value.filter(report => report.id !== deletedId)
  })

  return {
    provide: {
      htmlValidateReports,
    },
  }
})
