import type { HydrationMismatchPayload } from './runtime/hydration/types'
import type { ComponentLazyLoadData } from './runtime/lazy-load/schema'
import type { HtmlValidateReport } from './runtime/html-validate/types'

export interface HintsServerRpc {
  // Currently no server functions needed - data is fetched via REST API
}

export interface HintsClientRpc {
  onHydrationMismatch: (mismatch: HydrationMismatchPayload) => void
  onHydrationCleared: (ids: string[]) => void
  onLazyLoadReport: (report: ComponentLazyLoadData) => void
  onLazyLoadCleared: (id: string) => void
  onHtmlValidateReport: (report: HtmlValidateReport) => void
  onHtmlValidateDeleted: (id: string) => void
}
