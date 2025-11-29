import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    name: 'unit',
    include: ['test/unit/**/*.test.ts'],
  },
})
