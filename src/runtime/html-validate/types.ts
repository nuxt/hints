import type { ConfigData } from 'html-validate'

export type HtmlValidateFeatureOptions = ConfigData

export type HtmlValidateReport = {
  id: string
  html: string
  results: import('html-validate').Result[]
  path: string
}
