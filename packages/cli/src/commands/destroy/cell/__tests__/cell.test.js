global.__dirname = __dirname
jest.mock('fs')
jest.mock('src/lib', () => {
  return {
    ...jest.requireActual('src/lib'),
    generateTemplate: () => '',
  }
})

jest.mock('@redwoodjs/structure', () => {
  return {
    getProject: () => ({
      cells: [{ queryOperationName: undefined }],
    }),
  }
})

import fs from 'fs'

import 'src/lib/test'

import { files } from '../../../generate/cell/cell'
import { tasks } from '../cell'

beforeEach(() => {
  fs.__setMockFiles(files({ name: 'User' }))
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys cell files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({ componentName: 'cell', filesFn: files, name: 'User' })
  t.setRenderer('silent')

  return t.run().then(() => {
    const generatedFiles = Object.keys(files({ name: 'User' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
