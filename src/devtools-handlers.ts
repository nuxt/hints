import { createRouter } from 'h3'
import type { HintsClientFunctions } from './runtime/core/rpc-types'
import {
  getHydrationMismatches,
  clearHydrationMismatches,
  setHydrationNotify,
  getHandler as hydrationGet,
  postHandler as hydrationPost,
  deleteHandler as hydrationDelete,
} from './runtime/hydration/handlers'
import {
  getLazyLoadHints,
  clearLazyLoadHint,
  setLazyLoadNotify,
  getHandler as lazyLoadGet,
  postHandler as lazyLoadPost,
  deleteHandler as lazyLoadDelete,
} from './runtime/lazy-load/handlers'
import {
  getHtmlValidateReports,
  clearHtmlValidateReport,
  setHtmlValidateNotify,
  getHandler as htmlValidateGet,
  postHandler as htmlValidatePost,
  deleteHandler as htmlValidateDelete,
} from './runtime/html-validate/api-handlers'

export {
  getHydrationMismatches,
  clearHydrationMismatches,
  getLazyLoadHints,
  clearLazyLoadHint,
  getHtmlValidateReports,
  clearHtmlValidateReport,
}

export function setBroadcast(b: HintsClientFunctions) {
  setHydrationNotify({
    onMismatch: p => b.onHydrationMismatch(p),
    onCleared: ids => b.onHydrationCleared(ids),
  })
  setLazyLoadNotify({
    onReport: d => b.onLazyLoadReport(d),
    onCleared: id => b.onLazyLoadCleared(id),
  })
  setHtmlValidateNotify({
    onReport: r => b.onHtmlValidateReport(r),
    onDeleted: id => b.onHtmlValidateDeleted(id),
  })
}

export function createHintsRouter() {
  const router = createRouter()

  router.get('/hydration', hydrationGet)
  router.post('/hydration', hydrationPost)
  router.delete('/hydration', hydrationDelete)

  router.get('/lazy-load', lazyLoadGet)
  router.post('/lazy-load', lazyLoadPost)
  router.delete('/lazy-load/:id', lazyLoadDelete)

  router.get('/html-validate', htmlValidateGet)
  router.post('/html-validate', htmlValidatePost)
  router.delete('/html-validate/:id', htmlValidateDelete)

  return router
}
