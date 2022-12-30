export const buildSpawner = () => spawn

export const spawn = jest.fn()
export const spawnFollow = jest.fn()
export const sleep = () => {}
export const writeStdout = jest.fn()
export const clearStdout = () => {}
export const createLogger = () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
})
