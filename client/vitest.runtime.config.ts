import { defineVitestProject } from '@nuxt/test-utils/config'
import { fileURLToPath } from 'node:url'

export default defineVitestProject({
  test: {
    name: 'devtools-client:runtime',
    include: [
      './test/runtime/**/*.test.ts',
    ],
    environment: 'nuxt',
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./', import.meta.url)),
        overrides: {
          unocss: {
            // TODO: investigate why unocss cause file:///__uno.css not found error in test
            autoImport: false,  
          }
        }
      }, 
    },
  },
})
