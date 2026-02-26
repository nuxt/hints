import { createConsola } from 'consola'

// @ts-expect-error virtual file
import { features } from '#build/hints.config.mjs'
import type { FeatureFlags } from './types'

export function createHintsLogger(feature: keyof FeatureFlags) {
    return createConsola({
        level: (features as FeatureFlags).logs ? undefined : 0, // disable logging if logs FF is false
    }).withTag(`hints:${feature}`)
}

export const logger = createConsola().withTag('hints')
