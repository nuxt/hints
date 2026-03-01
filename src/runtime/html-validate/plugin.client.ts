import { defineNuxtPlugin } from '#imports'
import { parse } from 'devalue'
import type { HtmlValidateReport } from './types'
import { logger } from './utils'

export default defineNuxtPlugin({
  name: '@nuxt/hints:html-validate',
  setup() {
    if (document.getElementById('hints-html-validate')) {
      const data = parse(document.getElementById('hints-html-validate')!.textContent!) as HtmlValidateReport

      for (const result of data.results) {
        result.messages.forEach((message) => {
          logger.warn(`[html-validate] ${message.ruleId} at ${result.filePath}:${message.line}:${message.column} - ${message.message}`)
        })
      }
    }
  },
})
