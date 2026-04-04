import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { createHooks } from 'hookable'
import type { NitroRuntimeHooks, NitroApp } from 'nitropack/types'
import type { HintsClientFunctions } from '../../../src/runtime/core/rpc-types'
import rpcBridge from '../../../src/runtime/core/server/rpc-bridge'

describe('rpcBridge', () => {
  let hooks: ReturnType<typeof createHooks<NitroRuntimeHooks>>
  let mockBroadcast: HintsClientFunctions

  beforeEach(() => {
    hooks = createHooks()
    mockBroadcast = {
      onHydrationMismatch: vi.fn(),
      onHydrationCleared: vi.fn(),
      onLazyLoadReport: vi.fn(),
      onLazyLoadCleared: vi.fn(),
      onHtmlValidateReport: vi.fn(),
      onHtmlValidateDeleted: vi.fn(),
    }
    globalThis.__nuxtHintsRpcBroadcast = mockBroadcast

    rpcBridge({ hooks } as unknown as NitroApp)
  })

  afterEach(() => {
    globalThis.__nuxtHintsRpcBroadcast = undefined
  })

  it('should broadcast hydration mismatch via RPC', async () => {
    const mismatch = { id: '1', componentName: 'Test', fileLocation: '/test.vue', htmlPreHydration: '<div>', htmlPostHydration: '<span>' }
    await hooks.callHook('hints:hydration:mismatch', mismatch)
    expect(mockBroadcast.onHydrationMismatch).toHaveBeenCalledWith(mismatch)
  })

  it('should broadcast hydration cleared via RPC', async () => {
    await hooks.callHook('hints:hydration:cleared', { id: ['1', '2'] })
    expect(mockBroadcast.onHydrationCleared).toHaveBeenCalledWith(['1', '2'])
  })

  it('should broadcast lazy-load report via RPC', async () => {
    const data = { id: '1', route: '/', state: { pageLoaded: true, hasReported: true, directImports: [] } }
    await hooks.callHook('hints:lazy-load:report', data)
    expect(mockBroadcast.onLazyLoadReport).toHaveBeenCalledWith(data)
  })

  it('should broadcast lazy-load cleared via RPC', async () => {
    await hooks.callHook('hints:lazy-load:cleared', { id: 'test-id' })
    expect(mockBroadcast.onLazyLoadCleared).toHaveBeenCalledWith('test-id')
  })

  it('should broadcast html-validate report via RPC', async () => {
    const report = { id: '1', path: '/test', html: '<html></html>', results: [] }
    await hooks.callHook('hints:html-validate:report', report)
    expect(mockBroadcast.onHtmlValidateReport).toHaveBeenCalledWith(report)
  })

  it('should broadcast html-validate deleted via RPC', async () => {
    await hooks.callHook('hints:html-validate:deleted', 'test-id')
    expect(mockBroadcast.onHtmlValidateDeleted).toHaveBeenCalledWith('test-id')
  })

  it('should not throw when RPC broadcast is not available', async () => {
    globalThis.__nuxtHintsRpcBroadcast = undefined
    expect(() =>
      hooks.callHook('hints:hydration:mismatch', { id: '1', componentName: 'Test', fileLocation: '/test.vue', htmlPreHydration: '', htmlPostHydration: '' }),
    ).not.toThrow()
  })
})
