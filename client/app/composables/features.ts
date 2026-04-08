import type { FeaturesName } from '../../../src/runtime/core/types'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

export function useHintsConfig() {
  const hostNuxt = useHostNuxt()

  return hostNuxt.hints.config
}

export function useEnabledHintsFeatures(): Record<FeaturesName, boolean> {
  const client = useDevtoolsClient().value
  if (!client?.host?.nuxt) {
    return { hydration: true, lazyLoad: true, webVitals: false, thirdPartyScripts: false, htmlValidate: true }
  }
  const config = useHintsConfig()
  return Object.fromEntries<boolean>(
    Object.entries(config.features).map(([feature, flags]) => [
      feature,
      typeof flags === 'object' ? flags.devtools !== false : Boolean(flags),
    ] as [FeaturesName, boolean]),
  ) as Record<FeaturesName, boolean>
}

export function useHintsFeature(feature: FeaturesName): boolean {
  const client = useDevtoolsClient().value
  if (!client?.host?.nuxt) return true
  const config = useHintsConfig()
  return typeof config.features[feature] === 'object' ? config.features[feature].devtools !== false : Boolean(config.features[feature])
}
