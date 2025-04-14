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
  // todo add component location
}
type ImgFormatDetails = {
  type: ImagePerformanceIssueType.ImgFormat
  // todo add component location
}
type FetchPriorityMissingOnLCPElementDetails = {
  type: ImagePerformanceIssueType.FetchPriorityMissingOnLCPElement
  // todo add component location
}
type HeightWidthMissingOnLCPElementDetails = {
  type: ImagePerformanceIssueType.HeightWidthMissingOnLCPElement
  // todo add component location
}
type LoadingTooLongDetails = {
  type: ImagePerformanceIssueType.LoadingTooLong
  // todo add component location
}
type PreloadMissingOnLCPElementDetails = {
  type: ImagePerformanceIssueType.PreloadMissingOnLCPElement
  // todo add component location
}
export type ImagePerformanceIssueDetails = LazyAttrOnLCPElementDetails | ImgFormatDetails | FetchPriorityMissingOnLCPElementDetails | HeightWidthMissingOnLCPElementDetails | LoadingTooLongDetails | PreloadMissingOnLCPElementDetails
