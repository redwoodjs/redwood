import prompts from 'prompts'

import { MOCK_HEROKU_CTX } from '../__fixtures__'
import { createHerokuAppTask } from '../configure'
import { spawn } from '../stdio'

jest.mock('../stdio')
jest.mock('prompts')
jest.mock('../../../../../lib')
jest.mock('fs')

afterEach(() => {
  jest.resetAllMocks()
})

describe('Creating a heroku deployment', () => {
  it('creates a deployment with default config', async () => {
    await createHerokuAppTask({
      ...MOCK_HEROKU_CTX,
      defaults: true,
    })

    expect(spawn).toHaveBeenCalledWith(
      'heroku apps:create captain-crunch --manifest',
      {
        reject: true,
        stdio: 'inherit',
      }
    )
  })

  it('creates a deployment with selected app name', async () => {
    jest.mocked(prompts).mockResolvedValueOnce({
      selectedAppName: 'new-app-name',
    })

    await createHerokuAppTask(MOCK_HEROKU_CTX)

    expect(spawn).toHaveBeenCalledWith(
      'heroku apps:create new-app-name --manifest',
      {
        reject: true,
        stdio: 'inherit',
      }
    )
  })
})

describe('Heroku app already exists', () => {
  it('creates with new name', async () => {
    jest.mocked(prompts).mockResolvedValueOnce({ selectedAppName: 'foobar' })
    jest.mocked(spawn).mockResolvedValueOnce({ exitCode: 0 })

    await createHerokuAppTask(MOCK_HEROKU_CTX)

    expect(spawn).toHaveBeenCalledWith('heroku apps:create foobar --manifest', {
      reject: true,
      stdio: 'inherit',
    })
  })
})
