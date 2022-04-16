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

import { files } from '../../../generate/directive/directive'
import { tasks } from '../directive'

beforeEach(() => {
  fs.__setMockFiles(
    files({ name: 'require-admin', type: 'validator', tests: true })
  )
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys directive files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({
    name: 'require-admin',
    type: 'validator',
  })
  t.setRenderer('silent')

  return t.run().then(() => {
    const generatedFiles = Object.keys(
      files({ name: 'require-admin', type: 'validator', tests: true })
    )
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
