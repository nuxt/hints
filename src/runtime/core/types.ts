import type { FeatureOptionsMap } from '../feature-options'

export type FeaturesName = 'hydration' | 'lazyLoad' | 'webVitals' | 'thirdPartyScripts' | 'htmlValidate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FeatureFlags<T extends Record<string, any> = Record<string, never>> = {
  logs?: boolean
  devtools?: boolean
  /**
   * Any feature specific options
   */
  options?: T
}

/**
 * Fully-resolved features configuration type, where each feature
 * can be a simple boolean or a FeatureFlags with its own options.
 */
export type Features = {
  [K in FeaturesName]: boolean | FeatureFlags<K extends keyof FeatureOptionsMap ? FeatureOptionsMap[K] : Record<string, never>>
}
