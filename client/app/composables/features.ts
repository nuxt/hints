import type { FeaturesName } from '../../../src/runtime/core/types'

export function useHintsConfig() {
  const hostNuxt = useHostNuxt()

  return hostNuxt.hints.config
}

export function useEnabledHintsFeatures(): Record<FeaturesName, boolean> {
  const config = useHintsConfig()
  return Object.fromEntries<boolean>(
    Object.entries(config.features).map(([feature, flags]) => [
      feature,
      typeof flags === 'object' ? flags.devtools : Boolean(flags),
    ] as [FeaturesName, boolean])
  ) as Record<FeaturesName, boolean>
}

export function useHintsFeature(feature: FeaturesName): boolean {
  const config = useHintsConfig()
  return typeof config.features[feature] === 'object' ? config.features[feature].devtools : Boolean(config.features[feature])
}
