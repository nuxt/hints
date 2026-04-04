import type { NitroAppPlugin } from 'nitropack/types'
import { HtmlValidate, type ConfigData, type RuleConfig } from 'html-validate'
import { addBeforeBodyEndTag } from './utils'
import { randomUUID } from 'crypto'
import { stringify } from 'devalue'
import type { HtmlValidateReport } from './types'
import { format } from 'prettier/standalone'
import html from 'prettier/parser-html'
import { getFeatureOptions } from '../core/features'
import { defu } from 'defu'
import { getRequestURL } from 'h3'

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
        const origin = getRequestURL(event).origin
        globalThis.fetch(`${origin}/__nuxt_hints/html-validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => {})
      }
    }
  })
}
