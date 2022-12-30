import prompts from 'prompts'

import { MOCK_HEROKU_CTX } from '../__mocks__/ctx'
import { confirmationStep } from '../confirmation'
import { createReadyMessage, createBoxen } from '../messages'
import { PredeploySteps } from '../predeploy'

jest.mock('../stdio')
jest.mock('../messages')
jest.mock('boxen')
jest.mock('prompts')

beforeEach(() => {
  jest.resetAllMocks()
  jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit() was called')
  })
})

describe('prerequisites for heroku deploy', () => {
  it('skips all checks when defaults flag is present', async () => {
    await confirmationStep({
      ...MOCK_HEROKU_CTX,
      defaults: true,
    })
    const boxenCalls = jest.mocked(createBoxen).mock.calls
    expect(boxenCalls[0][0].includes('Using defaults')).toBeTruthy()
    expect(jest.mocked(createReadyMessage)).not.toHaveBeenCalled()
  })

  it('exits when not on OSX', async () => {
    await expect(
      confirmationStep({ ...MOCK_HEROKU_CTX, prereqs: { isDarwin: false } })
    ).rejects.toThrow('process.exit() was called')
  })

  it('should exit when not ready', async () => {
    jest.mocked(prompts).mockResolvedValueOnce({ value: 'quit' })
    await expect(
      confirmationStep({ ...MOCK_HEROKU_CTX, prereqs: { isDarwin: true } })
    ).rejects.toThrow('process.exit() was called')
  })

  it('should generate manual steps', async () => {
    jest
      .mocked(prompts)
      .mockResolvedValueOnce({ value: 'manual' })
      .mockResolvedValueOnce({
        selectedSteps: [
          PredeploySteps.COPY_CONFIG_TEMPLATES,
          PredeploySteps.GENERATE_HOME_ROUTE,
        ],
      })

    const actual = await confirmationStep({
      ...MOCK_HEROKU_CTX,
      prereqs: { isDarwin: true },
    })
    const enabled = actual.predeploySteps.filter((s) => s.enabled)
    expect(enabled.length).toBe(2)
  })
})
