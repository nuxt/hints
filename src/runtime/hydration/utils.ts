import { HINTS_ROUTE } from '../core/server/types'
import { createHintsLogger } from '../logger'

export const logger = createHintsLogger('hydration')

export const HYDRATION_ROUTE = `${HINTS_ROUTE}/hydration`

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

export function normalizeHTMLForComparison(html: string): string {
  return html.replace(/\sstyle=(["'])(.*?)\1/gs, (_, quote: string, style: string) => {
    return ` style=${quote}${normalizeStyleAttribute(style)}${quote}`
  })
}

function normalizeStyleAttribute(style: string): string {
  return style
    .split(';')
    .map(declaration => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(':')
      if (separatorIndex === -1) {
        return declaration
      }

      const property = declaration.slice(0, separatorIndex).trim()
      const value = normalizeStyleValue(declaration.slice(separatorIndex + 1).trim())
      return `${property}:${value}`
    })
    .join(';')
}

function normalizeStyleValue(value: string): string {
  let normalized = ''
  let quote: string | undefined

  for (let index = 0; index < value.length; index++) {
    const char = value[index]
    const previous = value[index - 1]

    if ((char === '"' || char === '\'') && previous !== '\\') {
      quote = quote === char ? undefined : quote ?? char
    }

    if (!quote && char === ',') {
      normalized += char
      while (/\s/.test(value[index + 1] ?? '')) {
        index++
      }
      continue
    }

    normalized += char
  }

  return normalized
}
