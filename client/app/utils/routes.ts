/**
 * Duplicated from src/runtime to avoid importing files that
 * transitively depend on the #build/hints.config.mjs virtual file
 * which is not available in the devtools client build.
 */

export const HINTS_ROUTE = '/__nuxt_hints'
export const HINTS_SSE_ROUTE = '/__nuxt_hints/sse'
export const HYDRATION_ROUTE = `${HINTS_ROUTE}/hydration`
export const LAZY_LOAD_ROUTE = `${HINTS_ROUTE}/lazy-load`
export const HTML_VALIDATE_ROUTE = `${HINTS_ROUTE}/html-validate`
