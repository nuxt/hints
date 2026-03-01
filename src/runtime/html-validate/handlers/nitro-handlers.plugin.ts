import type { NitroAppPlugin } from 'nitropack/types'
import { join } from 'pathe'
import { HTMLVALIDATE_ROUTE } from '../utils'
import { getAllHandler } from './get'
import { deleteHandler } from './delete'

export default <NitroAppPlugin> function (nitro) {
  nitro.router.add(
    HTMLVALIDATE_ROUTE,
    getAllHandler,
    'get',
  )

  nitro.router.add(
    join(HTMLVALIDATE_ROUTE, ':id'),
    deleteHandler,
    'delete',
  )

  // sse
  nitro.hooks.hook('hints:sse:setup', (context) => {
    context.unsubscribers.push(
      nitro.hooks.hook('hints:html-validate:report', (report) => {
        context.eventStream.push(
          {
            data: JSON.stringify(report),
            event: 'hints:html-validate:report',
          },
        )
      }),
      nitro.hooks.hook('hints:html-validate:deleted', (id) => {
        context.eventStream.push(
          {
            data: id,
            event: 'hints:html-validate:deleted',
          },
        )
      }),
    )
  })
}
