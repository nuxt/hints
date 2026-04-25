import type { NitroAppPlugin } from 'nitropack/types'
import { HtmlValidate, type ConfigData, type RuleConfig } from 'html-validate'
import { addBeforeBodyEndTag } from './utils'
import { storeHtmlValidateReport } from './api-handlers'
import { randomUUID } from 'crypto'
import { stringify } from 'devalue'
import type { HtmlValidateReport } from './types'
import { format } from 'prettier/standalone'
import html from 'prettier/parser-html'
import { getFeatureOptions } from '../core/features'
import { defu } from 'defu'

const HTML_VALIDATE_REPORT_HOOK = 'hints:html-validate:report' as const

const DEFAULT_EXTENDS = [
  'html-validate:standard',
  'html-validate:document',
  'html-validate:browser',
]

const DEFAULT_RULES: RuleConfig = {
  'svg-focusable': 'off',
  'no-unknown-elements': 'error',
  'void-style': 'off',
  'no-trailing-whitespace': 'off',
  // Conflict with Nuxt defaults
  'require-sri': 'off',
  'attribute-boolean-style': 'off',
  'doctype-style': 'off',
  // Unreasonable rule
  'no-inline-style': 'off',
}

export default <NitroAppPlugin> function (nitro) {
  const opts: ConfigData = defu({
    extends: DEFAULT_EXTENDS,
    rules: DEFAULT_RULES,
  }, getFeatureOptions('htmlValidate') ?? {})

  const validator = new HtmlValidate(opts)

  nitro.hooks.hook(HTML_VALIDATE_REPORT_HOOK, storeHtmlValidateReport)

  nitro.hooks.hook('render:response', async (response, { event }) => {
    if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
      const formattedBody = await format(response.body, { plugins: [html], parser: 'html' })
      const results = await validator.validateString(formattedBody)

      if (response.body && results.errorCount > 0) {
        const id = randomUUID()
        const data: HtmlValidateReport = {
          id,
          path: event.path,
          html: formattedBody,
          results: results.results,
        }
        response.body = addBeforeBodyEndTag(
          response.body,
          `<script id="hints-html-validate" type="application/json">${stringify(data)}</script>`,
        )
        nitro.hooks.callHook(HTML_VALIDATE_REPORT_HOOK, data).catch((error) => {
          nitro.captureError(error instanceof Error ? error : new Error(String(error)), { event })
        })
      }
    }
  })
}
