import console from 'node:console'

export const DEFAULT_MAX_ATTEMPTS = 24
export const DEFAULT_MAX_RUNTIME = 14_400 // 4 hours in seconds
export const DEFAULT_SLEEP_DELAY = 5 // 5 seconds
export const DEFAULT_DELETE_FAILED_JOBS = false
export const DEFAULT_LOGGER = console
export const DEFAULT_QUEUE = 'default'
export const DEFAULT_PRIORITY = 50
