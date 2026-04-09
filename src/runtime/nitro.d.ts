import type { HtmlValidateReport } from './html-validate/types'

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'hints:html-validate:report': (report: HtmlValidateReport) => void
  }
}
