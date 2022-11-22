import { builder, HEROKU_OPTIONS, handler } from '../heroku'
import { Logger } from '../modules/heroku/logger'

const mockListrRun = jest.fn()

jest.mock('listr2', () => ({
  Listr: jest.fn().mockImplementation(() => ({ run: mockListrRun })),
}))

jest.mock('../modules/heroku/logger')

const optionLength = Object.keys(HEROKU_OPTIONS).length

describe('heroku deploy handlers', () => {
  beforeAll(() => {
    jest.mocked(Logger).mockImplementation(() => ({
      enabled: false,
      log: jest.fn(),
      error: jest.fn(),
    }))
  })
  it('sets all of the options on the builder', async () => {
    const mockYargs = {
      option: jest.fn(),
    }
    await builder(mockYargs)
    expect(mockYargs.option).toHaveBeenCalledTimes(optionLength)
  })

  it('creates a listr task runner', async () => {
    const mockYargs = { foo: 'ass', handle: 'baz' }
    await handler(mockYargs)
    expect(mockListrRun).toHaveBeenCalledWith({
      ...mockYargs,
      logger: {
        enabled: false,
        log: expect.any(Function),
        error: expect.any(Function),
      },
    })
  })
})
