global.__dirname = __dirname
jest.mock('fs')
jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    generateTemplate: () => '',
  }
})

import fs from 'fs'

import 'src/lib/test'

import { files } from '../../../generate/component/component'
import { tasks } from '../component'

beforeEach(() => {
  fs.__setMockFiles(files({ name: 'About' }))
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys component files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({ componentName: 'component', filesFn: files, name: 'About' })
  t.setRenderer('silent')

  return t.run().then(() => {
    const generatedFiles = Object.keys(files({ name: 'About' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
