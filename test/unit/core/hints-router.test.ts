import { describe, it, expect, beforeEach } from 'vitest'
import { createHintsHandler } from '../../../src/devtools-handlers'
import { lazyLoadData } from '../../../src/runtime/lazy-load/handlers'
import { hydrationMismatches } from '../../../src/runtime/hydration/handlers'
import { htmlValidateReports } from '../../../src/runtime/html-validate/api-handlers'
import type { ComponentLazyLoadData } from '../../../src/runtime/lazy-load/schema'

const handle = createHintsHandler()

function request(path: string, init?: RequestInit) {
  return handle(new Request(`http://localhost/__nuxt_hints${path}`, init), path)
}

function post(path: string, body: unknown) {
  return request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
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

describe('hints handler', () => {
  beforeEach(() => {
    lazyLoadData.length = 0
    hydrationMismatches.length = 0
    htmlValidateReports.length = 0
  })

  it('POST /lazy-load responds 201', async () => {
    const res = await post('/lazy-load', lazyLoadPayload)

    expect(res.status).toBe(201)
    expect(lazyLoadData).toHaveLength(1)
  })

  it('POST /lazy-load responds 400 on invalid payload', async () => {
    const res = await post('/lazy-load', { id: 'broken' })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Validation failed' })
  })

  it('GET /lazy-load returns the stored hints as JSON', async () => {
    lazyLoadData.push(lazyLoadPayload)

    const res = await request('/lazy-load')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(await res.json()).toEqual([lazyLoadPayload])
  })

  it('DELETE /lazy-load/:id responds 204', async () => {
    lazyLoadData.push(lazyLoadPayload)

    const res = await request('/lazy-load/test-id', { method: 'DELETE' })

    expect(res.status).toBe(204)
    expect(lazyLoadData).toHaveLength(0)
  })

  it('DELETE /lazy-load/:id responds 404 for an unknown id', async () => {
    const res = await request('/lazy-load/missing', { method: 'DELETE' })

    expect(res.status).toBe(404)
  })

  it('POST /hydration responds 201 with the stored payload', async () => {
    const res = await post('/hydration', {
      componentName: 'Foo',
      fileLocation: 'components/Foo.vue',
    })

    expect(res.status).toBe(201)
    expect(hydrationMismatches).toHaveLength(1)
    expect(await res.json()).toMatchObject({ id: hydrationMismatches[0]!.id, componentName: 'Foo' })
  })

  it('POST /hydration responds 400 on invalid payload', async () => {
    const res = await post('/hydration', { componentName: 42 })

    expect(res.status).toBe(400)
    expect(hydrationMismatches).toHaveLength(0)
  })

  it('DELETE /hydration clears the given ids', async () => {
    hydrationMismatches.push(
      { id: 'a', componentName: 'A', fileLocation: 'a.vue', htmlPreHydration: '', htmlPostHydration: '' },
      { id: 'b', componentName: 'B', fileLocation: 'b.vue', htmlPreHydration: '', htmlPostHydration: '' },
    )

    const res = await request('/hydration', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: ['a'] }),
    })

    expect(res.status).toBe(204)
    expect(hydrationMismatches.map(m => m.id)).toEqual(['b'])
  })

  it('POST /hydration accepts a component without a name', async () => {
    // Template-only SFCs have no name, displayName or __name
    const res = await post('/hydration', {
      htmlPreHydration: '<div>1</div>',
      htmlPostHydration: '<div>2</div>',
      fileLocation: 'pages/repro.vue',
    })

    expect(res.status).toBe(201)
    expect(hydrationMismatches).toHaveLength(1)
  })

  it('POST /hydration responds 400 on invalid payload', async () => {
    const res = await post('/hydration', { componentName: 1, fileLocation: 'pages/repro.vue' })

    expect(res.status).toBe(400)
    expect(hydrationMismatches).toHaveLength(0)
  })

  it('POST /html-validate responds 201', async () => {
    const res = await post('/html-validate', { id: 'report-1' })

    expect(res.status).toBe(201)
    expect(htmlValidateReports).toHaveLength(1)
  })

  it('unknown routes respond 404 instead of falling through', async () => {
    const res = await request('/unknown')

    expect(res.status).toBe(404)
  })

  it('unsupported methods respond 405', async () => {
    const res = await request('/hydration', { method: 'PUT' })

    expect(res.status).toBe(405)
  })
})
