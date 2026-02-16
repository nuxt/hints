import { createError, defineEventHandler, setResponseStatus, readBody } from 'h3'
import type { NitroApp } from 'nitropack/types'
import type { ComponentLazyLoadData } from './schema'
import { ComponentLazyLoadDataSchema } from './schema'
import { parse } from 'valibot'
import type { HintsSseContext } from '../core/server/types'
import { LAZY_LOAD_ROUTE } from './utils'

const data: ComponentLazyLoadData[] = []

export default function (nitroApp: NitroApp) {
  const getHandler = defineEventHandler(() => {
    return data
  })

  const postHandler = defineEventHandler(async (event) => {
    const body = await readBody(event)
    const parsed = parse(ComponentLazyLoadDataSchema, body)
    data.push(parsed)
    nitroApp.hooks.callHook('hints:lazy-load:report', parsed)
    setResponseStatus(event, 201)
  })

  const deleteHandler = defineEventHandler(async (event) => {
    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, message: 'ID is required' })
    }

    const index = data.findIndex(item => item.id === id)
    if (index !== -1) {
      data.splice(index, 1)
    }
    else {
      throw createError({ statusCode: 404, message: 'Entry not found' })
    }
    nitroApp.hooks.callHook('hints:lazy-load:cleared', { id })
    setResponseStatus(event, 204)
  })

  nitroApp.router.add(LAZY_LOAD_ROUTE, getHandler, 'get')
  nitroApp.router.add(LAZY_LOAD_ROUTE, postHandler, 'post')
  nitroApp.router.add(`${LAZY_LOAD_ROUTE}/:id`, deleteHandler, 'delete')

  nitroApp.hooks.hook('hints:sse:setup', (context: HintsSseContext) => {
    context.unsubscribers.push(
      nitroApp.hooks.hook('hints:lazy-load:report', (payload) => {
        context.eventStream.push({
          data: JSON.stringify(payload),
          event: 'hints:lazy-load:report',
        })
      }),
      nitroApp.hooks.hook('hints:lazy-load:cleared', (payload) => {
        context.eventStream.push({
          data: JSON.stringify(payload.id),
          event: 'hints:lazy-load:cleared',
        })
      }),
    )
  })
}
