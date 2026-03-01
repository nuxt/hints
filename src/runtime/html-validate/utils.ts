import { join } from 'pathe'
import { HINTS_ROUTE } from '../core/server/types'
import { createHintsLogger } from '../logger'

export const logger = createHintsLogger('htmlValidate')

export const HTMLVALIDATE_ROUTE = join(HINTS_ROUTE, 'html-validate')

export function addBeforeBodyEndTag(html: string, content: string) {
  const closingBodyTagIndex = html.lastIndexOf('</body>')
  if (closingBodyTagIndex === -1) {
    return html + content
  }
  return html.slice(0, closingBodyTagIndex) + content + html.slice(closingBodyTagIndex)
}
