import execa from 'execa'

import 'src/lib/test'
import yarnCheckFiles from '..'

jest.mock('execa', () => jest.fn())

describe('rw setup tailwind - yarnCheckFiles task', () => {
  test('it calls yarn install --check-files', async () => {
    const task = yarnCheckFiles()
    await task()

    expect(execa).toHaveBeenCalledWith('yarn', ['install', '--check-files'])
  })
})
