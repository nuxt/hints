import { useServerHooks } from 'nuxt/server'
import { HtmlValidate, type ConfigData, type RuleConfig } from 'html-validate'
import { randomUUID } from 'node:crypto'
import { stringify } from 'devalue'
import type { HtmlValidateReport } from './types'
import { format } from 'prettier/standalone'
import html from 'prettier/parser-html'
import { getFeatureOptions, getHintsApiRoute } from '../core/features'
import { defu } from 'defu'

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

interface RenderHTMLContext {
  htmlAttrs: string[]
  head: string[]
  bodyAttrs: string[]
  bodyPrepend: string[]
  body: string[]
  bodyAppend: string[]
}

const joinTags = (tags: string[]) => tags.join('')
const joinAttrs = (chunks: string[]) => (chunks.length ? ' ' + chunks.join(' ') : '')


export function renderHTMLDocument(ctx: RenderHTMLContext) {
  return '<!DOCTYPE html>'
    + `<html${joinAttrs(ctx.htmlAttrs)}>`
    + `<head>${joinTags(ctx.head)}</head>`
    + `<body${joinAttrs(ctx.bodyAttrs)}>${joinTags(ctx.bodyPrepend)}${joinTags(ctx.body)}${joinTags(ctx.bodyAppend)}</body>`
    + '</html>'
}

function headerOf(headers: unknown, name: string): string | undefined {
  if (!headers) return undefined
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) ?? undefined
  const value = (headers as Record<string, string | string[] | undefined>)[name]
  return Array.isArray(value) ? value[0] : value
}

function getRequestOrigin(event: unknown): string | undefined {
  const e = event as {
    url?: unknown
    // web `Request` on h3 v2, Node `IncomingMessage` (relative `url`) on h3 v1
    req?: { url?: unknown, headers?: unknown }
    headers?: unknown
    node?: { req?: { headers?: unknown } }
  }
  if (e.url instanceof URL) return e.url.origin
  if (typeof e.req?.url === 'string' && /^https?:\/\//.test(e.req.url)) return new URL(e.req.url).origin
  const headers = e.headers ?? e.req?.headers ?? e.node?.req?.headers
  const host = headerOf(headers, 'host')
  if (!host) return undefined
  return `${headerOf(headers, 'x-forwarded-proto') ?? 'http'}://${host}`
}

async function reportToDevServer(event: unknown, data: HtmlValidateReport) {
  const origin = getRequestOrigin(event)
  if (!origin) return
  try {
    await fetch(new URL(`${getHintsApiRoute()}/html-validate`, origin), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    })
  }
  catch (error) {
    console.debug('[hints] Could not report the html-validate result to the dev server', error)
  }
}

function getRequestPath(event: unknown): string {
  const e = event as { url?: unknown, path?: unknown }
  if (e.url instanceof URL) return e.url.pathname
  if (typeof e.path === 'string') return e.path
  if (typeof e.url === 'string') return e.url.split('?')[0] || '/'
  return '/'
}

export default function htmlValidatePlugin() {
  const opts: ConfigData = defu({
    extends: DEFAULT_EXTENDS,
    rules: DEFAULT_RULES,
  }, getFeatureOptions('htmlValidate') ?? {})

  const validator = new HtmlValidate(opts)

  useServerHooks().hook('render:html', async (htmlContext, { event, streaming }) => {
    // streamed page is validated chunk by chunk by the browser
    if (streaming) return
    try {
      const formattedBody = await format(renderHTMLDocument(htmlContext), { plugins: [html], parser: 'html' })
      const results = await validator.validateString(formattedBody)

      if (results.errorCount > 0) {
        const data: HtmlValidateReport = {
          id: randomUUID(),
          path: getRequestPath(event),
          html: formattedBody,
          results: results.results,
        }
        htmlContext.bodyAppend.push(`<script id="hints-html-validate" type="application/json">${stringify(data)}</script>`)
        await reportToDevServer(event, data)
      }
    }
    catch (error) {
      // https://github.com/nuxt/hints/issues/360
      // html validate can throw errors for some html
      console.warn('HTML Validate error:', error instanceof Error ? error.message : String(error))
    }
  })
}
