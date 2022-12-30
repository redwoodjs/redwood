import { builder, handler, command, description } from '../heroku'
import { confirmationStep } from '../modules/heroku'

jest.mock('../modules/heroku')
jest.mock('../../../lib')

const mockProcessExit = jest
  .spyOn(process, 'exit')
  .mockImplementation((code?: number) => {
    return code as never
  })

jest.spyOn(console, 'error').mockImplementation(() => {})

beforeEach(() => {
  jest.clearAllMocks()
})

it('exports required methods', () => {
  expect(command).toBe('heroku')
  expect(description).toBe('Setup and deploy to Heroku')
  expect(builder).toBeInstanceOf(Function)
  expect(handler).toBeInstanceOf(Function)
})

it('runs the steps', async () => {
  expect(handler({} as any)).resolves.not.toThrow()
})

it('exists on error', async () => {
  jest.mocked(confirmationStep).mockRejectedValue(new Error('boom'))
  await handler({} as any)
  expect(mockProcessExit).toHaveBeenCalled()
})

it('adds options to yargs', () => {
  const mockYargs = {
    options: jest.fn(),
  }
  builder(mockYargs as any)
  expect(mockYargs.options).toHaveBeenCalled()
})
