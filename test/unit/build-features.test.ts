import { describe, it, expect } from 'vitest'
import { isFeatureDevtoolsEnabled, isFeatureEnabled, getFeatureOptions } from '../../src/features'
import type { ModuleOptions } from '../../src/module'

function makeOptions(features: ModuleOptions['features']): ModuleOptions {
  return { devtools: true, features }
}

describe('build-time feature helpers', () => {
  describe('isFeatureEnabled', () => {
    it('returns true when feature is set to true', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(isFeatureEnabled(opts, 'hydration')).toBe(true)
    })

    it('returns false when feature is set to false', () => {
      const opts = makeOptions({
        hydration: false,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(isFeatureEnabled(opts, 'hydration')).toBe(false)
    })

    it('returns true when feature is an object', () => {
      const opts = makeOptions({
        hydration: { logs: true },
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(isFeatureEnabled(opts, 'hydration')).toBe(true)
    })
  })

  describe('isFeatureDevtoolsEnabled', () => {
    it('returns true for a boolean-enabled feature', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(isFeatureDevtoolsEnabled(opts, 'hydration')).toBe(true)
    })

    it('returns false for a boolean-disabled feature', () => {
      const opts = makeOptions({
        hydration: false,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(isFeatureDevtoolsEnabled(opts, 'hydration')).toBe(false)
    })

    it('reads devtools flag from object config', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: { devtools: false },
        thirdPartyScripts: { devtools: true },
        htmlValidate: true,
      })
      expect(isFeatureDevtoolsEnabled(opts, 'webVitals')).toBe(false)
      expect(isFeatureDevtoolsEnabled(opts, 'thirdPartyScripts')).toBe(true)
    })

    it('defaults devtools to true when not specified in object', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: { logs: false },
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(isFeatureDevtoolsEnabled(opts, 'webVitals')).toBe(true)
    })
  })

  describe('getFeatureOptions', () => {
    it('returns the options object for a feature with options', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: {
          options: {
            ignoreDomains: ['cdn.example.com'],
            trackedMetrics: ['LCP', 'INP'],
          },
        },
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(getFeatureOptions(opts, 'webVitals')).toEqual({
        ignoreDomains: ['cdn.example.com'],
        trackedMetrics: ['LCP', 'INP'],
      })
    })

    it('returns empty object when feature is a boolean', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: true,
      })
      expect(getFeatureOptions(opts, 'thirdPartyScripts')).toEqual({})
    })

    it('returns empty object when feature object has no options key', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: { logs: false },
        htmlValidate: true,
      })
      expect(getFeatureOptions(opts, 'thirdPartyScripts')).toEqual({})
    })

    it('returns thirdPartyScripts options', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: {
          options: {
            ignoredDomains: ['tracker.example.com'],
            ignoredSchemes: ['custom://'],
          },
        },
        htmlValidate: true,
      })
      expect(getFeatureOptions(opts, 'thirdPartyScripts')).toEqual({
        ignoredDomains: ['tracker.example.com'],
        ignoredSchemes: ['custom://'],
      })
    })

    it('returns htmlValidate options', () => {
      const opts = makeOptions({
        hydration: true,
        lazyLoad: true,
        webVitals: true,
        thirdPartyScripts: true,
        htmlValidate: {
          options: {
            rules: { 'no-inline-style': 'off' },
          },
        },
      })
      expect(getFeatureOptions(opts, 'htmlValidate')).toEqual({
        rules: { 'no-inline-style': 'off' },
      })
    })
  })
})
