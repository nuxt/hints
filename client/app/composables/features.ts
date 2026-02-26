import type { FeatureFlags, Features } from '../../../src/runtime/core/types'

export function useHintsConfig() {
  const hostNuxt = useHostNuxt()

  return hostNuxt.hints.config
}

export function useHintsFeature(feature: Features): FeatureFlags {
  const config = useHintsConfig()
  return config.features[feature]
}
