global.__dirname = __dirname
jest.mock('fs')
jest.mock('src/lib', () => {
  return {
    ...require.requireActual('src/lib'),
    generateTemplate: () => '',
  }
})

import fs from 'fs'

import 'src/lib/test'

import { files } from '../../../generate/service/service'
import { tasks } from '../service'

beforeEach(async () => {
  fs.__setMockFiles(await files({ name: 'User' }))
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys service files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({ componentName: 'service', filesFn: files, name: 'User' })
  t.setRenderer('silent')

  return t.run().then(async () => {
    const generatedFiles = Object.keys(await files({ name: 'User' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
