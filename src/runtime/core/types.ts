export type FeaturesName = 'hydration' | 'lazyLoad' | 'webVitals' | 'thirdPartyScripts' | 'htmlValidate'

/**
 * FF used by modules options and to expose in the payload for devtools
 */
export type FeatureFlags = {
  logs: boolean
  devtools: boolean
}

export type Features = Record<FeaturesName, FeatureFlags>
