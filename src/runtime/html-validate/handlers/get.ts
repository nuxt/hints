import { defineEventHandler } from 'h3'
import { storage } from '../storage'
import type { HtmlValidateReport } from '../types'

export const getAllHandler = defineEventHandler(() => {
  return storage.getKeys().then(
    keys => Promise.all(keys.map(key => storage.getItem<HtmlValidateReport>(key))),
  )
})
