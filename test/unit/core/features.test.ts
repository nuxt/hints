import { describe, it, expect, vi } from 'vitest'

const mockFeatures = vi.hoisted(() => ({
  hydration: true,
  lazyLoad: false,
  webVitals: {
    logs: true,
    devtools: false,
    options: {
      ignoreDomains: ['cdn.example.com'],
      trackedMetrics: ['LCP', 'CLS'],
    },
  },
  thirdPartyScripts: {
    logs: false,
    devtools: true,
    options: {
      ignoredDomains: ['analytics.example.com'],
      ignoredSchemes: ['custom-scheme://'],
    },
  },
  htmlValidate: {
    devtools: true,
  },
}))

vi.mock('#shared/hints-config', () => ({
  features: mockFeatures,
}))

const {
  isFeatureEnabled,
  isFeatureDevtoolsEnabled,
  isFeatureLogsEnabled,
  getFeatureOptions,
} = await import('../../../src/runtime/core/features')

describe('runtime feature helpers', () => {
  describe('isFeatureEnabled', () => {
    it('returns true for a boolean-enabled feature', () => {
      expect(isFeatureEnabled('hydration')).toBe(true)
    })

    it('returns false for a boolean-disabled feature', () => {
      expect(isFeatureEnabled('lazyLoad')).toBe(false)
    })

    it('returns true for an object-configured feature', () => {
      expect(isFeatureEnabled('webVitals')).toBe(true)
    })
  })

  describe('isFeatureDevtoolsEnabled', () => {
    it('returns true for a boolean-enabled feature (defaults to true)', () => {
      expect(isFeatureDevtoolsEnabled('hydration')).toBe(true)
    })

    it('returns false for a boolean-disabled feature', () => {
      expect(isFeatureDevtoolsEnabled('lazyLoad')).toBe(false)
    })

    it('reads devtools flag from object config', () => {
      expect(isFeatureDevtoolsEnabled('webVitals')).toBe(false)
      expect(isFeatureDevtoolsEnabled('thirdPartyScripts')).toBe(true)
    })

    it('defaults to true when devtools is not set in object config', () => {
      expect(isFeatureDevtoolsEnabled('htmlValidate')).toBe(true)
    })
  })

  describe('isFeatureLogsEnabled', () => {
    it('returns true for a boolean-enabled feature (defaults to true)', () => {
      expect(isFeatureLogsEnabled('hydration')).toBe(true)
    })

    it('returns false for a boolean-disabled feature', () => {
      expect(isFeatureLogsEnabled('lazyLoad')).toBe(false)
    })

    it('reads logs flag from object config', () => {
      expect(isFeatureLogsEnabled('webVitals')).toBe(true)
      expect(isFeatureLogsEnabled('thirdPartyScripts')).toBe(false)
    })

    it('defaults to true when logs is not set in object config', () => {
      expect(isFeatureLogsEnabled('htmlValidate')).toBe(true)
    })
  })

  describe('getFeatureOptions', () => {
    it('returns options for a feature with options set', () => {
      expect(getFeatureOptions('webVitals')).toEqual({
        ignoreDomains: ['cdn.example.com'],
        trackedMetrics: ['LCP', 'CLS'],
      })
    })

    it('returns options for thirdPartyScripts', () => {
      expect(getFeatureOptions('thirdPartyScripts')).toEqual({
        ignoredDomains: ['analytics.example.com'],
        ignoredSchemes: ['custom-scheme://'],
      })
    })

    it('returns undefined for a feature with no options', () => {
      expect(getFeatureOptions('htmlValidate')).toBeUndefined()
    })
  })
})
