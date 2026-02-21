import type { InferOutput } from 'valibot'
import { array, boolean, object, string, omit } from 'valibot'

export const ComponentLazyLoadImportSchema = object({
  componentName: string(),
  importSource: string(),
  importedBy: string(),
  rendered: boolean(),
})

export type DirectImportInfo = InferOutput<typeof ComponentLazyLoadImportSchema>

export const ComponentLazyLoadDataSchema = object({
  id: string(),
  route: string(),
  state: object({
    pageLoaded: boolean(),
    hasReported: boolean(),
    directImports: array(ComponentLazyLoadImportSchema),
  }),
})

export type ComponentLazyLoadData = InferOutput<typeof ComponentLazyLoadDataSchema>

export type ComponentLazyLoadState = {
  directImports: Map<string, DirectImportInfo>
  hasReported: boolean
  pageLoaded: boolean
}

export const CreateComponentLazyLoadDataSchema = omit(ComponentLazyLoadDataSchema, ['id'])

export type CreateComponentLazyLoadData = InferOutput<typeof CreateComponentLazyLoadDataSchema>