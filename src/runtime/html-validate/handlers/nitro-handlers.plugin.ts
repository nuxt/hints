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
}
