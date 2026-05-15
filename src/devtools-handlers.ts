import { createRouter } from 'h3'
import {
  getHydrationMismatches,
  clearHydrationMismatches,
  getHandler as hydrationGet,
  postHandler as hydrationPost,
  deleteHandler as hydrationDelete,
} from './runtime/hydration/handlers'
import {
  getLazyLoadHints,
  clearLazyLoadHint,
  getHandler as lazyLoadGet,
  postHandler as lazyLoadPost,
  deleteHandler as lazyLoadDelete,
} from './runtime/lazy-load/handlers'
import {
  getHtmlValidateReports,
  clearHtmlValidateReport,
  getHandler as htmlValidateGet,
  postHandler as htmlValidatePost,
  deleteHandler as htmlValidateDelete,
} from './runtime/html-validate/api-handlers'
import { addDevServerHandler } from '@nuxt/kit'

export {
  getHydrationMismatches,
  clearHydrationMismatches,
  getLazyLoadHints,
  clearLazyLoadHint,
  getHtmlValidateReports,
  clearHtmlValidateReport,
}

function createHintsRouter() {
  const router = createRouter({
    preemptive: true
  })

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

export function registerDevServerHandlers() {
  const router = createHintsRouter()

  addDevServerHandler({
    route: '/__nuxt_hints',
    handler: router.handler,
  })
}