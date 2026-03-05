export interface WebVitalsFeatureOptions {
  ignoreDomains?: string[]
  trackedMetrics?: Array<'LCP' | 'INP' | 'CLS'>
}
