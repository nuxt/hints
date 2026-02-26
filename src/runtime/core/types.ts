export type Features = 'hydration' | 'lazyLoad' | 'webVitals' | 'thirdPartyScripts'

/**
 * FF used by modules options and to expose in the payload for devtools
 */
export type FeatureFlags = {
  logs: boolean
  devtools: boolean
}
