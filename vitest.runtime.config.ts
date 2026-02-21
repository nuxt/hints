import { defineVitestProject } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

export default defineVitestProject({
  test: {
    name: 'runtime',
    include: [
      './test/runtime/**/*.test.ts',
    ],
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./test/fixtures/basic', import.meta.url)),
      },
    },
  },
})
