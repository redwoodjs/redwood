import { command, description, builder, handler } from '../setup'

// mock Telemetry for CLI commands so they don't try to spawn a process
jest.mock('@redwoodjs/telemetry', () => {
  return {
    errorTelemetry: () => jest.fn(),
    timedTelemetry: () => jest.fn(),
  }
})

test('standard exports', () => {
  expect(command).toEqual('netlify')
  expect(description).toMatch(/Netlify/)
  expect(typeof builder).toEqual('function')
  expect(typeof handler).toEqual('function')
})
