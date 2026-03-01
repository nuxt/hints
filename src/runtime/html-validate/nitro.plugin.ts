import type { NitroAppPlugin } from 'nitropack/types'
import { HtmlValidate } from 'html-validate'
import { addBeforeBodyEndTag } from './utils'
import { storage } from './storage'
import { randomUUID } from 'crypto'
import { stringify } from 'devalue'
import type { HtmlValidateReport } from './types'
import { format } from 'prettier/standalone'
import html from 'prettier/parser-html'

export default <NitroAppPlugin> function (nitro) {
  const validator = new HtmlValidate({
    extends: [
      'html-validate:standard',
      'html-validate:document',
      'html-validate:browser',
    ],
    rules: {
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
    },
  })

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
        storage.setItem(id, data)
        response.body = addBeforeBodyEndTag(
          response.body,
          `<script id="hints-html-validate" type="application/json">${stringify(data)}</script>`,
        )
        nitro.hooks.callHook('hints:html-validate:report', data)
      }
    }
  })
}
