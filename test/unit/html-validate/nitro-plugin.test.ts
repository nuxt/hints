import { beforeEach, describe, expect, it, vi } from 'vitest'
import plugin from '../../../src/runtime/html-validate/nitro.plugin'
import { htmlValidateReports } from '../../../src/runtime/html-validate/api-handlers'

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

const rpcMock = vi.hoisted(() => ({
  onHtmlValidateReport: vi.fn(),
  onHtmlValidateDeleted: vi.fn(),
}))

vi.mock('../../../src/runtime/core/rpc', () => ({
  getRPC: () => rpcMock,
}))

vi.mock('crypto', () => ({
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

vi.mock('html-validate', () => ({
  HtmlValidate: class {
    async validateString() {
      return {
        errorCount: 1,
        results: reportResults,
      }
    }
  },
}))

vi.mock('../../../src/runtime/core/features', () => ({
  getFeatureOptions: () => undefined,
}))

vi.mock('../../../src/runtime/html-validate/utils', () => ({
  addBeforeBodyEndTag: (body: string, tag: string) => body.replace('</body>', `${tag}</body>`),
}))

describe('html-validate nitro plugin', () => {
  beforeEach(() => {
    htmlValidateReports.length = 0
    rpcMock.onHtmlValidateReport.mockClear()
    rpcMock.onHtmlValidateDeleted.mockClear()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('dispatches reports through a nitro hook without a loopback fetch', async () => {
    const hookHandlers = new Map<string, Function>()
    const hook = vi.fn((name: string, handler: Function) => {
      hookHandlers.set(name, handler)
    })
    const callHook = vi.fn(async (name: string, payload: unknown) => {
      const handler = hookHandlers.get(name)
      await handler?.(payload)
    })
    const captureError = vi.fn()

    plugin({
      captureError,
      hooks: {
        hook,
        callHook,
      },
    } as never)

    const renderResponse = hookHandlers.get('render:response')
    const reportHook = hookHandlers.get('hints:html-validate:report')

    expect(renderResponse).toBeTypeOf('function')
    expect(reportHook).toBeTypeOf('function')

    const event = {
      path: '/demo',
      context: {},
    }
    const response = {
      body: '<html><body></body></html>',
      headers: {
        'content-type': 'text/html',
      },
    }

    await renderResponse?.(response, { event })

    expect(response.body).toContain('hints-html-validate')
    expect(globalThis.fetch).not.toHaveBeenCalled()
    expect(htmlValidateReports).toHaveLength(1)
    expect(htmlValidateReports[0]).toMatchObject({
      id: 'report-1',
      path: '/demo',
      html: '<html><body></body></html>',
      results: reportResults,
    })
    expect(callHook).toHaveBeenCalledTimes(1)
    expect(callHook).toHaveBeenCalledWith('hints:html-validate:report', expect.objectContaining({ id: 'report-1' }))
    expect(rpcMock.onHtmlValidateReport).toHaveBeenCalledTimes(1)
    expect(rpcMock.onHtmlValidateReport).toHaveBeenCalledWith(expect.objectContaining({ id: 'report-1' }))
    expect(captureError).not.toHaveBeenCalled()

    await reportHook?.(htmlValidateReports[0])

    expect(htmlValidateReports).toHaveLength(1)
    expect(rpcMock.onHtmlValidateReport).toHaveBeenCalledTimes(1)
  })
})
