import { MOCK_HEROKU_CTX } from '../__mocks__/mock_ctx'
import { HerokuApi } from '../api'
import { pushStep } from '../push'

jest.mock('../api')
jest.mock('../stdio')

describe('pushing a new app', () => {
  it('adds a remote and pushes', async () => {
    await pushStep(MOCK_HEROKU_CTX)

    expect(HerokuApi.addRemote).toHaveBeenCalled()
    expect(HerokuApi.push).toHaveBeenCalled()
  })
})
