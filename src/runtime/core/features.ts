// @ts-expect-error virtual file
import { features } from '#hints-config'
import type { FeaturesName } from './types'
import type { FeatureOptionsMap } from '../feature-options'

export function isFeatureDevtoolsEnabled(feature: FeaturesName): boolean {
  return features[feature] != null && typeof features[feature] === 'object' ? features[feature].devtools !== false : !!features[feature]
}

export function isFeatureLogsEnabled(feature: FeaturesName): boolean {
  return features[feature] != null && typeof features[feature] === 'object' ? features[feature].logs !== false : !!features[feature]
}

export function isFeatureEnabled(feature: FeaturesName): boolean {
  return !!features[feature]
}

export function getFeatureOptions<K extends keyof FeatureOptionsMap>(feature: K): FeatureOptionsMap[K] | undefined {
  const val = features[feature]
  if (typeof val === 'object' && val.options) {
    return val.options as FeatureOptionsMap[K]
  }
  return undefined
}
