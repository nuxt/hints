import { HINTS_ROUTE } from '../core/server/types'
import { createHintsLogger } from '../logger'

export const logger = createHintsLogger('lazyLoad')

export const LAZY_LOAD_ROUTE = `${HINTS_ROUTE}/lazy-load`
