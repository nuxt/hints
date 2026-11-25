import type { HydrationMismatchPayload, HydrationMismatchResponse } from '../hydration/types'
import type { ComponentLazyLoadData } from '../lazy-load/schema'
import type { HtmlValidateReport } from '../html-validate/types'

export interface HintsClientFunctions {
  onHydrationMismatch: (mismatch: HydrationMismatchPayload) => void
  onHydrationCleared: (ids: string[]) => void
  onLazyLoadReport: (data: ComponentLazyLoadData) => void
  onLazyLoadCleared: (id: string) => void
  onHtmlValidateReport: (report: HtmlValidateReport) => void
  onHtmlValidateDeleted: (id: string) => void
}

export interface HintsServerFunctions {
  getHydrationMismatches: () => HydrationMismatchResponse
  clearHydrationMismatches: (ids: string[]) => void
  getLazyLoadHints: () => ComponentLazyLoadData[]
  clearLazyLoadHint: (id: string) => void
  getHtmlValidateReports: () => HtmlValidateReport[]
  clearHtmlValidateReport: (id: string) => void
}

export const RPC_NAMESPACE = 'nuxt-hints'

export const SERVER_RPC_NAMES = {
  getHydrationMismatches: 'get-hydration-mismatches',
  clearHydrationMismatches: 'clear-hydration-mismatches',
  getLazyLoadHints: 'get-lazy-load-hints',
  clearLazyLoadHint: 'clear-lazy-load-hint',
  getHtmlValidateReports: 'get-html-validate-reports',
  clearHtmlValidateReport: 'clear-html-validate-report',
} as const satisfies Record<keyof HintsServerFunctions, string>

export const CLIENT_RPC_NAMES = {
  onHydrationMismatch: 'on-hydration-mismatch',
  onHydrationCleared: 'on-hydration-cleared',
  onLazyLoadReport: 'on-lazy-load-report',
  onLazyLoadCleared: 'on-lazy-load-cleared',
  onHtmlValidateReport: 'on-html-validate-report',
  onHtmlValidateDeleted: 'on-html-validate-deleted',
} as const satisfies Record<keyof HintsClientFunctions, string>

export type ServerRpcName = typeof SERVER_RPC_NAMES[keyof typeof SERVER_RPC_NAMES]
export type ClientRpcName = typeof CLIENT_RPC_NAMES[keyof typeof CLIENT_RPC_NAMES]
