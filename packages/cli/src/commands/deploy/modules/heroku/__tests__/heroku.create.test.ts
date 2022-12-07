import { MOCK_HEROKU_CTX } from '../__fixtures__'
import { Heroku } from '../api'
import { createStep } from '../create'
import { Questions } from '../questions'

jest.mock('../stdio')
jest.mock('../api')
jest.mock('../questions')

afterEach(() => {
  jest.resetAllMocks()
})

describe('Creating a heroku deployment', () => {
  it('creates a deployment with default config', async () => {
    jest.mocked(Questions.chooseAppName).mockResolvedValueOnce('myapp')
    jest.mocked(Heroku.create).mockResolvedValueOnce('myapp')
    const actual = await createStep(MOCK_HEROKU_CTX)
    expect(actual).toEqual({
      ...MOCK_HEROKU_CTX,
      appName: 'myapp',
      appUrl: 'myapp',
    })
  })

  it('attempts to create twice', async () => {
    jest
      .mocked(Questions.chooseAppName)
      .mockResolvedValueOnce('first-choice-name')
    jest
      .mocked(Heroku.create)
      .mockResolvedValueOnce('already taken')
      .mockResolvedValueOnce('second-try-good-url')

    jest.mocked(Questions.nameExistsChooseOption).mockResolvedValueOnce('new')

    jest.mocked(Questions.chooseAppName).mockResolvedValueOnce('new-app-name')
    const actual = await createStep(MOCK_HEROKU_CTX)

    expect(actual).toEqual({
      ...MOCK_HEROKU_CTX,
      appName: 'new-app-name',
      appUrl: 'second-try-good-url',
    })
  })

  it('deletes then creates when selected', async () => {
    jest.mocked(Questions.chooseAppName).mockResolvedValueOnce('first-try-bad')
    jest
      .mocked(Heroku.create)
      .mockResolvedValueOnce('already taken')
      .mockResolvedValueOnce('second-try-good')

    jest
      .mocked(Questions.nameExistsChooseOption)
      .mockResolvedValueOnce('delete')

    await createStep(MOCK_HEROKU_CTX)

    expect(Heroku.destroy).toHaveBeenCalled()
  })
})
