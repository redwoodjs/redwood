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

import { files } from '../../../generate/layout/layout'
import { tasks } from '../layout'

beforeEach(() => {
  fs.__setMockFiles(files({ name: 'Blog' }))
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys layout files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({ componentName: 'layout', filesFn: files, name: 'Blog' })
  t.setRenderer('silent')

  return t.run().then(() => {
    const generatedFiles = Object.keys(files({ name: 'Blog' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})

test('destroys layout files with stories and tests', async () => {
  fs.__setMockFiles(files({ name: 'Blog', stories: true, tests: true }))
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({
    componentName: 'layout',
    filesFn: files,
    name: 'Blog',
    stories: true,
    tests: true,
  })
  t.setRenderer('silent')

  return t.run().then(() => {
    const generatedFiles = Object.keys(
      files({ name: 'Blog', stories: true, tests: true })
    )
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
