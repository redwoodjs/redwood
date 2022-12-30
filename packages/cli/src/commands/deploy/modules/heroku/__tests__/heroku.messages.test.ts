import { MOCK_HEROKU_CTX } from '../__mocks__/ctx'
import { createReadyMessage, createActionsMessages } from '../messages'

jest.mock('../stdio')

describe('message creation', () => {
  it('skips when default is set', async () => {
    const actual = createReadyMessage({ ...MOCK_HEROKU_CTX, defaults: true })
    expect(actual).toBe('--defaults flag found... Goin for it!')
  })

  it('creates ready messages', async () => {
    const allErrors = createReadyMessage({
      ...MOCK_HEROKU_CTX,
      prereqs: {
        isDarwin: false,
        isGitRepo: false,
        isGitClean: false,
        isPackageJsonClean: false,
        isPrismaConfigured: false,
      },
    })

    expect(allErrors.split('\n').length).toBe(6)

    const allGood = createReadyMessage({
      ...MOCK_HEROKU_CTX,
      prereqs: {
        isDarwin: true,
        isGitRepo: true,
        isGitClean: true,
        isPackageJsonClean: true,
        isPrismaConfigured: true,
        hasHomeRoute: true,
      },
    })
    expect(allGood.split('\n').length).toBe(1)
  })

  it('creates action messages', () => {
    const actual = createActionsMessages(MOCK_HEROKU_CTX)
    expect(actual.split('\n').length).toBe(10)
  })
})
