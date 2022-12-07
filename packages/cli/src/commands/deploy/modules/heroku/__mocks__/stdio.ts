export const spawn = jest.fn().mockResolvedValue({
  exitCode: 0,
})

export const spawnFollow = jest.fn()

export const createLogger = () => ({
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  log: jest.fn(),
})
