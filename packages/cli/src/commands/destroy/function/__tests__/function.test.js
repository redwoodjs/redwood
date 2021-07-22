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
  fs.__setMockFiles(await files({ name: 'sendMail' }))
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys service files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({
    componentName: 'service',
    filesFn: files,
    name: 'sendMail',
  })
  t.setRenderer('silent')

  return t.run().then(async () => {
    const generatedFiles = Object.keys(await files({ name: 'sendMail' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
