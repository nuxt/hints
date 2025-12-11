import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export const distDir = dirname(fileURLToPath(import.meta.url))
