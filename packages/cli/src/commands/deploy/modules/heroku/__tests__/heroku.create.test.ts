import { MOCK_HEROKU_CTX } from '../__mocks__/ctx'
import { HerokuApi } from '../api'
import { createStep, pushStep } from '../create'

jest.mock('../stdio')
jest.mock('../api')

afterEach(() => {
  jest.resetAllMocks()
})

describe('Creating a heroku deployment', () => {
  it('creates a new heroku app', async () => {
    jest.mocked(HerokuApi.create).mockResolvedValueOnce('good-url')

    const actual = await createStep(MOCK_HEROKU_CTX)

    expect(actual.appUrl).toEqual('good-url')
  })

  it('deletes old and creates new when appname already exists', async () => {
    jest
      .mocked(HerokuApi.create)
      .mockResolvedValueOnce('already taken')
      .mockResolvedValueOnce('second-try-good-url')

    const actual = await createStep(MOCK_HEROKU_CTX)

    expect(HerokuApi.destroy).toHaveBeenCalled()
    expect(HerokuApi.create).toHaveBeenCalledTimes(2)
    expect(actual.appUrl).toEqual('second-try-good-url')
  })

  it('fails completely when second attempt fails', async () => {
    jest
      .mocked(HerokuApi.create)
      .mockResolvedValueOnce('already taken')
      .mockResolvedValueOnce('already taken')

    await expect(createStep(MOCK_HEROKU_CTX)).rejects.toThrow(
      'mock create fail error'
    )
  })

  it('throws when an unknown error occurs while creating', async () => {
    jest.mocked(HerokuApi.create).mockResolvedValueOnce('')

    await expect(createStep(MOCK_HEROKU_CTX)).rejects.toThrow()
  })
})

describe('push app', () => {
  it('adds a remote and pushes', async () => {
    await pushStep(MOCK_HEROKU_CTX)

    expect(HerokuApi.addRemote).toHaveBeenCalled()
    expect(HerokuApi.push).toHaveBeenCalled()
  })
})
