import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApp, eventHandler, toWebHandler } from 'h3'
import { createHintsRouter } from '../../../src/devtools-handlers'
import { lazyLoadData } from '../../../src/runtime/lazy-load/handlers'
import { hydrationMismatches } from '../../../src/runtime/hydration/handlers'
import { htmlValidateReports } from '../../../src/runtime/html-validate/api-handlers'
import type { ComponentLazyLoadData } from '../../../src/runtime/lazy-load/schema'

const renderer = vi.fn(() => 'rendered by nuxt')

function createTestHandler() {
  const app = createApp()
  app.use(createHintsRouter())
  app.use(eventHandler(renderer))
  return toWebHandler(app)
}

function post(path: string, body: unknown) {
  return createTestHandler()(new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }))
}

const lazyLoadPayload: ComponentLazyLoadData = {
  id: 'test-id',
  route: '/lazy-test',
  state: {
    pageLoaded: true,
    hasReported: true,
    directImports: [
      {
        componentName: 'HeavyComponent',
        importSource: '~/components/HeavyComponent.vue',
        importedBy: 'pages/lazy-test.vue',
        rendered: false,
      },
    ],
  },
}

describe('hints router', () => {
  beforeEach(() => {
    lazyLoadData.length = 0
    hydrationMismatches.length = 0
    htmlValidateReports.length = 0
    renderer.mockClear()
  })

  it('POST /lazy-load responds 201 without falling through to the renderer', async () => {
    const res = await post('/lazy-load', lazyLoadPayload)

    expect(res.status).toBe(201)
    expect(renderer).not.toHaveBeenCalled()
    expect(lazyLoadData).toHaveLength(1)
  })

  it('POST /lazy-load responds 400 on invalid payload', async () => {
    const res = await post('/lazy-load', { id: 'broken' })

    expect(res.status).toBe(400)
    expect(renderer).not.toHaveBeenCalled()
  })

  it('DELETE /lazy-load/:id responds 204', async () => {
    lazyLoadData.push(lazyLoadPayload)

    const res = await createTestHandler()(
      new Request('http://localhost/lazy-load/test-id', { method: 'DELETE' }),
    )

    expect(res.status).toBe(204)
    expect(renderer).not.toHaveBeenCalled()
    expect(lazyLoadData).toHaveLength(0)
  })

  it('POST /hydration responds 201', async () => {
    const res = await post('/hydration', {
      componentName: 'Foo',
      fileLocation: 'components/Foo.vue',
    })

    expect(res.status).toBe(201)
    expect(renderer).not.toHaveBeenCalled()
    expect(hydrationMismatches).toHaveLength(1)
  })

  it('POST /html-validate responds 201', async () => {
    const res = await post('/html-validate', { id: 'report-1' })

    expect(res.status).toBe(201)
    expect(renderer).not.toHaveBeenCalled()
    expect(htmlValidateReports).toHaveLength(1)
  })

  it('unknown routes respond 404 from the router', async () => {
    const res = await createTestHandler()(
      new Request('http://localhost/unknown', { method: 'GET' }),
    )

    expect(res.status).toBe(404)
  })
})
