export interface ThirdPartyScriptsFeatureOptions {
  /** Additional domains to ignore when detecting third-party scripts */
  ignoredDomains?: string[]
  /** Additional URL scheme patterns to ignore (default includes browser extension schemes) */
  ignoredSchemes?: string[]
}
