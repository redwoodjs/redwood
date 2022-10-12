global.__dirname = __dirname
jest.mock('fs')
jest.mock('../../../../lib', () => {
  return {
    ...jest.requireActual('../../../../lib'),
    generateTemplate: () => '',
  }
})

import fs from 'fs'

import '../../../../lib/test'

import { files } from '../../../generate/function/function'
import { tasks } from '../function'

beforeEach(async () => {
  fs.__setMockFiles(files({ name: 'sendMail' }))
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
  console.info.mockRestore()
  console.log.mockRestore()
})

test('destroys service files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({
    componentName: 'service',
    filesFn: files,
    name: 'sendMail',
  })
  t.options.renderer = 'silent'

  return t.run().then(async () => {
    const generatedFiles = Object.keys(files({ name: 'sendMail' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
