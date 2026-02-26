import { createConsola } from 'consola'

// @ts-expect-error virtual file
import { features } from '#build/hints.config.mjs'
import type { Features, FeatureFlags } from './core/types'

export function createHintsLogger(feature: Features) {
    return createConsola({
        level: (features as Record<Features, FeatureFlags>)[feature]?.logs ? undefined : 0,
    }).withTag(`hints:${feature}`)
}

export const logger = createConsola().withTag('hints')
