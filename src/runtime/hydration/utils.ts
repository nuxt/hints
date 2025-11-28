export const HYDRATION_ROUTE = '/__nuxt_hydration'
export const HYDRATION_SSE_ROUTE = '/__nuxt_hydration/sse'

export function formatHTML(html: string | undefined): string {
  if (!html) return ''

  // Simple HTML formatting function
  let formatted = ''
  let indent = 0
  const tags = html.split(/(<\/?[^>]+>)/g)

  for (const tag of tags) {
    if (!tag.trim()) continue

    if (tag.startsWith('</')) {
      indent--
      formatted += '\n' + '  '.repeat(Math.max(0, indent)) + tag
    }
    else if (tag.startsWith('<') && !tag.endsWith('/>') && !tag.includes('<!')) {
      formatted += '\n' + '  '.repeat(Math.max(0, indent)) + tag
      indent++
    }
    else if (tag.startsWith('<')) {
      formatted += '\n' + '  '.repeat(Math.max(0, indent)) + tag
    }
    else {
      formatted += '\n' + '  '.repeat(Math.max(0, indent)) + tag.trim()
    }
  }

  return formatted.trim()
}
