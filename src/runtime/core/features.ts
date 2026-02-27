// @ts-expect-error virtual file
import { features } from '#hints-config'
import type { FeatureFlags, FeaturesName } from './types'

export function isFeatureDevtoolsEnabled(feature: FeaturesName): boolean {
    return typeof features[feature] === 'object' ? features[feature].devtools : !!features[feature]
}

export function isFeatureLogsEnabled(feature: FeaturesName): boolean {
    return typeof features[feature] === 'object' ? features[feature].logs : !!features[feature]
}

export function isFeatureEnabled(feature: FeaturesName): boolean {
    return !!features[feature]
}