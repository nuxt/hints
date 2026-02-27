import type { FeaturesName } from '../../../src/runtime/core/types'

export function useHintsConfig() {
  const hostNuxt = useHostNuxt()

  return hostNuxt.hints.config
}

export function useHintsFeature(feature: FeaturesName): boolean {
  const config = useHintsConfig()
  return typeof config.features[feature] === 'object' ? config.features[feature].devtools : Boolean(config.features[feature])
}
