import type { NitroAppPlugin } from 'nitropack/types'
import { HtmlValidate } from 'html-validate'
import { addBeforeBodyEndTag } from './utils'
import { storage } from './storage'
import { randomUUID } from 'crypto'
import { stringify } from 'devalue'

export default <NitroAppPlugin>function (nitro) {
  const validator = new HtmlValidate({
    extends: [
      'html-validate:standard',
      'html-validate:document',
      'html-validate:browser',
    ],
  })

  nitro.hooks.hook('render:response', async (response, { event }) => {
    if (typeof response.body === 'string' && (response.headers?.['Content-Type'] || response.headers?.['content-type'])?.includes('html')) {
      const results = await validator.validateString(response.body)

      if (response.body && results.errorCount > 0) {
        const id = randomUUID()
        const data = {
          id,
          path: event.path,
          html: response.body,
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

  nitro.hooks.hook('hints:sse:setup', ({ eventStream, unsubscribers }) => {
    unsubscribers.push(
      nitro.hooks.hook('hints:html-validate:report', (report) => {
        eventStream.push(
          JSON.stringify({
            event: 'hints:html-validate:report',
            data: JSON.stringify(report),
          })
        )
      })
    )
  })
}
