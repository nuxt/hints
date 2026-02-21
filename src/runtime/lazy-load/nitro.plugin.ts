import { createError, defineEventHandler, setResponseStatus, readBody } from 'h3'
import type { NitroApp } from 'nitropack/types'
import type { ComponentLazyLoadData, CreateComponentLazyLoadData } from './schema'
import { ComponentLazyLoadDataSchema, CreateComponentLazyLoadDataSchema } from './schema'
import { parse, ValiError } from 'valibot'
import type { HintsSseContext } from '../core/server/types'
import { LAZY_LOAD_ROUTE } from './utils'
import { createStorage } from 'unstorage'

const storage = createStorage<ComponentLazyLoadData>()

export default function (nitroApp: NitroApp) {
  const getHandler = defineEventHandler(async () => {
    return await storage.getKeys().then(async (keys) => {
      const items = await Promise.all(keys.map((key) => storage.getItem(key)))
      return items.filter((item): item is ComponentLazyLoadData => item !== null)
    })
  })

  const postHandler = defineEventHandler(async (event) => {
    const body = await readBody(event)
    let parsed: CreateComponentLazyLoadData
    try {
      parsed = parse(CreateComponentLazyLoadDataSchema, body)
    }
    catch (error) {
      if (error instanceof ValiError) {
        setResponseStatus(event, 400)
        return { error: 'Validation failed', message: error.message }
      }
      throw error
    }
    const id = crypto.randomUUID()
    const data = { ...parsed, id }
    await storage.setItem(id, data)
    nitroApp.hooks.callHook('hints:lazy-load:report', data)
    setResponseStatus(event, 201)
  })

  const deleteHandler = defineEventHandler(async (event) => {
    const id = event.context.params?.id
    if (!id) {
      throw createError({ statusCode: 400, message: 'ID is required' })
    }

    const hasKey = await storage.hasItem(id)
    if (hasKey) {
      await storage.removeItem(id)
    } else {
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
