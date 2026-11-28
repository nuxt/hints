import { beforeEach, describe, expect, it, vi } from 'vitest'
import plugin, { renderHTMLDocument } from '../../../src/runtime/html-validate/nitro.plugin'

const reportResults = [
  {
    filePath: '/demo',
    messages: [
      {
        ruleId: 'no-unknown-elements',
        message: 'Unknown element',
        line: 1,
        column: 1,
        offset: 0,
        size: 1,
        selector: 'body',
      },
    ],
    errorCount: 1,
    warningCount: 0,
    source: '<html><body></body></html>',
  },
]

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const hookHandlers = vi.hoisted(() => new Map<string, Function>())

vi.mock('nuxt/server', () => ({
  useServerHooks: () => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    hook: (name: string, handler: Function) => {
      hookHandlers.set(name, handler)
      return () => hookHandlers.delete(name)
    },
  }),
}))

vi.mock('node:crypto', () => ({
  randomUUID: () => 'report-1',
}))

vi.mock('devalue', () => ({
  stringify: () => '{"id":"report-1"}',
}))

vi.mock('prettier/standalone', () => ({
  format: vi.fn(async (value: string) => value),
}))

vi.mock('prettier/parser-html', () => ({
  default: {},
}))

const validateString = vi.hoisted(() => vi.fn(async () => ({
  errorCount: 1,
  results: reportResults,
})))

vi.mock('html-validate', () => ({
  HtmlValidate: class {
    validateString = validateString
  },
}))

const devServerOrigin = vi.hoisted(() => ({ value: 'http://localhost:3000' as string | null }))

vi.mock('../../../src/runtime/core/features', () => ({
  getFeatureOptions: () => undefined,
  getHintsApiRoute: () => '/__nuxt_hints',
  getDevServerOrigin: () => devServerOrigin.value,
}))

const fetchMock = vi.hoisted(() => vi.fn(async () => new Response(null, { status: 201 })))

function createHtmlContext() {
  return {
    htmlAttrs: [] as string[],
    head: ['<title>demo</title>'],
    bodyAttrs: [] as string[],
    bodyPrepend: [] as string[],
    body: ['<div id="__nuxt"></div>'],
    bodyAppend: [] as string[],
  }
}

describe('html-validate nitro plugin', () => {
  beforeEach(() => {
    hookHandlers.clear()
    fetchMock.mockClear()
    validateString.mockClear()
    devServerOrigin.value = 'http://localhost:3000'
    vi.stubGlobal('fetch', fetchMock)
  })

  it('renders the document the same way Nuxt does', () => {
    const html = renderHTMLDocument({
      htmlAttrs: ['lang="en"'],
      head: ['<title>a</title>'],
      bodyAttrs: ['class="dark"'],
      bodyPrepend: ['<!--pre-->'],
      body: ['<div id="__nuxt"></div>'],
      bodyAppend: ['<script>1</script>'],
    })
    expect(html).toBe('<!DOCTYPE html><html lang="en"><head><title>a</title></head><body class="dark"><!--pre--><div id="__nuxt"></div><script>1</script></body></html>')
  })

  it('validates the rendered page on render:html and reports to the dev-server API', async () => {
    plugin()

    const renderHtml = hookHandlers.get('render:html')
    expect(renderHtml).toBeTypeOf('function')

    const htmlContext = createHtmlContext()
    const event = { url: new URL('http://localhost/demo'), req: new Request('http://localhost/demo') }

    await renderHtml?.(htmlContext, { event })

    expect(validateString).toHaveBeenCalledWith(renderHTMLDocument({ ...htmlContext, bodyAppend: [] }))
    expect(htmlContext.bodyAppend.join('')).toContain('<script id="hints-html-validate" type="application/json">{"id":"report-1"}</script>')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(url.href).toBe('http://localhost:3000/__nuxt_hints/html-validate')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toMatchObject({
      id: 'report-1',
      path: '/demo',
      results: reportResults,
    })
  })

  it('never derives the report destination from request headers', async () => {
    plugin()
    const htmlContext = createHtmlContext()
    const headers = { 'host': 'evil.example', 'x-forwarded-proto': 'http://collector.example/' }
    const nodeReq = { url: '/demo', headers }
    const event = { path: '/demo', req: nodeReq, node: { req: nodeReq }, headers: new Headers(headers) }

    await hookHandlers.get('render:html')?.(htmlContext, { event })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit]
    expect(url.href).toBe('http://localhost:3000/__nuxt_hints/html-validate')
    expect(JSON.parse(init.body as string)).toMatchObject({ path: '/demo' })
  })

  it('does not post a report when the Hints API is not registered (devtools off)', async () => {
    devServerOrigin.value = null
    plugin()
    const htmlContext = createHtmlContext()

    await hookHandlers.get('render:html')?.(htmlContext, { event: { url: new URL('http://localhost/demo') } })

    // the page still carries the report for the browser overlay
    expect(htmlContext.bodyAppend.join('')).toContain('hints-html-validate')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips streamed renders', async () => {
    plugin()
    const htmlContext = createHtmlContext()

    await hookHandlers.get('render:html')?.(htmlContext, { event: { url: new URL('http://localhost/demo') }, streaming: true })

    expect(validateString).not.toHaveBeenCalled()
    expect(htmlContext.bodyAppend).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not inject anything when the page is valid', async () => {
    validateString.mockResolvedValueOnce({ errorCount: 0, results: [] })
    plugin()
    const htmlContext = createHtmlContext()

    await hookHandlers.get('render:html')?.(htmlContext, { event: { url: new URL('http://localhost/ok') } })

    expect(htmlContext.bodyAppend).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
