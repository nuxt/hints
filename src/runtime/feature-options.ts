import type { HtmlValidateFeatureOptions } from './html-validate/types'
import type { ThirdPartyScriptsFeatureOptions } from './third-party-scripts/types'
import type { WebVitalsFeatureOptions } from './web-vitals/types'

export interface FeatureOptionsMap {
  thirdPartyScripts: ThirdPartyScriptsFeatureOptions
  htmlValidate: HtmlValidateFeatureOptions
  webVitals: WebVitalsFeatureOptions
}
