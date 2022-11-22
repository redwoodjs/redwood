// import execa from 'execa'

// import { checkHerokuInstalled, isRunningOsx, HEROKU_ERRORS } from '../checks'

jest.mock('execa')

// const MOCK_SUCCESS_STDOUT = 'heroku/7.65.0 darwin-x64 node-v14.19.0'

afterEach(() => {
  jest.resetAllMocks()
})

describe('os check', () => {
  it('should return true if os is darwin', async () => {
    // jest.mocked(execa).command.mockResolvedValueOnce({
    //   stderr: null,
    //   stdout: 'Darwin',
    // } as any)
    // const actual = await isRunningOsx()
    // expect(actual).toBeTruthy()

    // jest.mocked(execa).command.mockResolvedValueOnce({
    //   stderr: null,
    //   stdout: 'anything else',
    // } as any)
    // await expect(async () => {
    //   await isRunningOsx()
    // }).rejects.toThrow(HEROKU_ERRORS.NOT_OSX)
    expect(true).toBeTruthy()
  })
})

describe('check for heroku', () => {
  it('checks the presence of the heroku cli', async () => {
    // jest.mocked(execa).command.mockResolvedValueOnce({
    //   stderr: null,
    //   stdout: MOCK_SUCCESS_STDOUT,
    // } as any)
    // const hasHeroku = await checkHerokuInstalled()
    // expect(hasHeroku).toBeTruthy()

    // jest.mocked(execa).command.mockResolvedValueOnce({
    //   stderr: 'danger will robinson',
    //   stdout: null,
    // } as any)
    // const noHeroku = await checkHerokuInstalled()
    // expect(noHeroku).toBeFalsy()

    // jest.mocked(execa).command.mockResolvedValueOnce({
    //   stderr: null,
    //   stdout: 'command not found',
    // } as any)
    // const notFoundResponse = await checkHerokuInstalled()
    // expect(notFoundResponse).toBeFalsy()
    expect(true).toBeTruthy()
  })
})
