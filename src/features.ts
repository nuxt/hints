import type { ModuleOptions } from './module'
import type { FeaturesName } from './runtime/core/types'
import type { FeatureOptionsMap } from './runtime/feature-options'

export function isFeatureDevtoolsEnabled(options: ModuleOptions, feature: FeaturesName): boolean {
  const val = options.features[feature]
  return typeof val === 'object' ? val.devtools !== false : !!val
}

export function isFeatureEnabled(options: ModuleOptions, feature: FeaturesName): boolean {
  return !!options.features[feature]
}

/**
 * Extract the per-feature options from the module config.
 * Returns an empty object if the feature is set to a simple boolean.
 */
export function getFeatureOptions<K extends keyof FeatureOptionsMap>(
  options: ModuleOptions,
  feature: K,
): FeatureOptionsMap[K] {
  const val = options.features[feature]
  if (typeof val === 'object' && val.options) {
    return val.options as FeatureOptionsMap[K]
  }
  return {} as FeatureOptionsMap[K]
}
