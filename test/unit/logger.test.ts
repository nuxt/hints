import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createHintsLogger } from '../../src/runtime/logger'

const mockFeatures = vi.hoisted(() => ({
  hydration: { logs: true, devtools: true },
  lazyLoad: { logs: false, devtools: true },
  webVitals: { logs: true, devtools: false },
  thirdPartyScripts: { logs: false, devtools: false },
}))

vi.mock('#build/hints.config.mjs', () => ({
  features: mockFeatures,
}))

vi.spyOn(process.stdout, 'write')
describe('createHintsLogger', () => {
  it('returns a consola instance tagged with the feature name', () => {
    const logger = createHintsLogger('hydration')
    expect(logger.options.defaults?.tag).toBe('hints:hydration')
  })

  it('enables logging when feature logs flag is true', () => {
    const logger = createHintsLogger('hydration')
    expect(logger.level).not.toBe(0)
  })

  it('disables logging when feature logs flag is false', () => {
    const logger = createHintsLogger('lazyLoad')
    expect(logger.level).toBe(0)
  })

  it('respects logs flag per feature independently', () => {
    expect(createHintsLogger('webVitals').level).not.toBe(0)
    expect(createHintsLogger('thirdPartyScripts').level).toBe(0)
  })

  describe('logging behavior', () => {
    it('logs messages when enabled', () => {
      const logger = createHintsLogger('hydration')
      logger.info('Test message')
        expect(process.stdout.write).toHaveBeenCalledWith(expect.stringContaining('Test message'))
    })

    it('does not log messages when disabled', () => {
      const logger = createHintsLogger('lazyLoad')
      logger.info('This should not be logged')
      expect(process.stdout.write).not.toHaveBeenCalledWith(expect.stringContaining('This should not be logged'))
    })
  })
})
