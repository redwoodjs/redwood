import { vi } from 'vitest'

export const mockLogger = {
  log: vi.fn(() => {}),
  info: vi.fn(() => {}),
  debug: vi.fn(() => {}),
  warn: vi.fn(() => {}),
  error: vi.fn(() => {}),
}

export const mockAdapter = {
  options: {},
  logger: mockLogger,
  schedule: vi.fn(() => {}),
  find: () => null,
  clear: () => {},
  success: (_job: { handler: string; args: any }) => {},
  failure: (_job: { handler: string; args: any }, _error: Error) => {},
}
