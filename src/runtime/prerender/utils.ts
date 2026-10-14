/**
 * Get all stacktrace lines without the current file
 * Don't use in build files if we ever goes into build mode nuxt hiints. Thank you.
 */
export function getStackTraceLines(): string[] {
  const stackObject: { stack: string } = {} as { stack: string }
  Error.captureStackTrace(stackObject)

  return stackObject.stack
    .split('\n')
    .slice(1)
    .map(line => line.trim())
}
