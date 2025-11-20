import { useNuxtApp } from '#imports'
import { describe, vi, it, expect, beforeEach } from 'vitest'
import plugin from './../../src/runtime/third-party-scripts/plugin.client'

const triggerFn = vi.fn()
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      for (const node of mutation.addedNodes) {
        if (node.nodeName === 'SCRIPT') {
          setTimeout(() => {
            triggerFn()
          }, 15)
        }
      }
    }
  }
})
observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
})

describe('third-party', () => {
  const callHookSpy = vi.spyOn(useNuxtApp(), 'callHook')

  beforeEach(() => {
    callHookSpy.mockClear()
    triggerFn.mockClear()
  })

  plugin(useNuxtApp())

  it('should call hook on script added', async () => {
    const script = document.createElement('script')
    script.src = 'https://example.com/third-party.js'
    document.body.appendChild(script)
    // wait for mutation observer to trigger

    await vi.waitFor(() => expect(triggerFn).toHaveBeenCalled())

    expect(callHookSpy).toHaveBeenCalled()
    expect(callHookSpy).toHaveBeenCalledWith('hints:scripts:added', script)
    document.body.removeChild(script)
  })

  it('should not call hook on same-origin script', async () => {
    const script = document.createElement('script')
    script.src = window.location.origin + '/same-origin.js'
    document.body.appendChild(script)
    // wait for mutation observer to trigger
    await vi.waitFor(() => expect(triggerFn).toHaveBeenCalled())

    expect(callHookSpy).not.toHaveBeenCalledWith('hints:scripts:added', script)
    document.body.removeChild(script)
  })

  it.each(
    ['chrome-extension://some-extension.js', 'moz-extension://some-extension.js', 'ms-browser-extension://some-extension.js'],
  )('should not call hook on extension script', async (src) => {
    const script = document.createElement('script')
    script.src = src
    document.body.appendChild(script)
    // wait for mutation observer to trigger
    await vi.waitFor(() => expect(triggerFn).toHaveBeenCalled())

    expect(callHookSpy).not.toHaveBeenCalledWith('hints:scripts:added', expect.anything())
    document.body.removeChild(script)
  })
})
