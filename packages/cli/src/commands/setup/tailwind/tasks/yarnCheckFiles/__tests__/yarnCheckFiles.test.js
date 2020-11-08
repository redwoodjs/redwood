import execa from 'execa'

import 'src/lib/test'
import yarnCheckFiles from '..'

jest.mock('execa', () => jest.fn())

describe('rw setup tailwind - yarnCheckFiles task', () => {
  test('it calls yarn install --check-files', () => {
    const task = yarnCheckFiles()
    task()

    expect(execa).toHaveBeenCalledWith('yarn', ['install', '--check-files'])
  })
})
