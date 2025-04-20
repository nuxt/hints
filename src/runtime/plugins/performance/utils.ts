export enum ImagePerformanceIssueType {
  LazyAttrOnLCPElement,
  ImgFormat,
  FetchPriorityMissingOnLCPElement,
  HeightWidthMissingOnLCPElement,
  LoadingTooLong,
  PreloadMissingOnLCPElement,
}

type LazyAttrOnLCPElementDetails = {
  type: ImagePerformanceIssueType.LazyAttrOnLCPElement
}
type ImgFormatDetails = {
  type: ImagePerformanceIssueType.ImgFormat
}
type FetchPriorityMissingOnLCPElementDetails = {
  type: ImagePerformanceIssueType.FetchPriorityMissingOnLCPElement
}
type HeightWidthMissingOnLCPElementDetails = {
  type: ImagePerformanceIssueType.HeightWidthMissingOnLCPElement
}
type LoadingTooLongDetails = {
  type: ImagePerformanceIssueType.LoadingTooLong
}
type PreloadMissingOnLCPElementDetails = {
  type: ImagePerformanceIssueType.PreloadMissingOnLCPElement
}
export type ImagePerformanceIssueDetails = LazyAttrOnLCPElementDetails | ImgFormatDetails | FetchPriorityMissingOnLCPElementDetails | HeightWidthMissingOnLCPElementDetails | LoadingTooLongDetails | PreloadMissingOnLCPElementDetails
