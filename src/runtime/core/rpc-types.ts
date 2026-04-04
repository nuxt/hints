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
