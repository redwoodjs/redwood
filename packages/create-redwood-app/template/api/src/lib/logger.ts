import { createLogger, defaultLoggerOptions } from '@redwoodjs/api/logger'

/**
 * Creates a logger. Options define how to log. Destination defines where to log.
 * If no destination, std out.
 */
export const logger = createLogger({
  options: { ...defaultLoggerOptions },
})
