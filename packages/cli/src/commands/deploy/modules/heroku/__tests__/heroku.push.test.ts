import { MOCK_HEROKU_CTX } from '../__fixtures__/mock_ctx'
import { Heroku } from '../api'
import { pushStep } from '../push'

jest.mock('../api')
jest.mock('../stdio')

describe('pushing a new app', () => {
  it('adds a remote and pushes', async () => {
    await pushStep(MOCK_HEROKU_CTX)

    expect(Heroku.addRemote).toHaveBeenCalled()
    expect(Heroku.push).toHaveBeenCalled()
  })
})
