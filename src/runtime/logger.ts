import { createConsola } from 'consola'

import { isFeatureLogsEnabled } from './core/features'
import type { FeaturesName } from './core/types'

export function createHintsLogger(feature: FeaturesName) {
  return createConsola({
    level: isFeatureLogsEnabled(feature) ? undefined : 0,
  }).withTag(`hints:${feature}`)
}

export const logger = createConsola().withTag('hints')
