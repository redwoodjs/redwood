global.__dirname = __dirname

jest.mock('fs')
jest.mock('../../../../lib', () => {
  return {
    ...jest.requireActual('../../../../lib'),
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

import '../../../../lib/test'

import { files } from '../../../generate/cell/cell'
import { tasks } from '../cell'

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {})
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
  console.info.mockRestore()
  console.log.mockRestore()
})

test('destroys cell files', async () => {
  fs.__setMockFiles(await files({ name: 'User' }))
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({
    componentName: 'cell',
    filesFn: files,
    name: 'User',
  })
  t.options.renderer = 'silent'

  await t.run()

  const generatedFiles = Object.keys(await files({ name: 'User' }))
  expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
  generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
})

test('destroys cell files with stories and tests', async () => {
  fs.__setMockFiles(await files({ name: 'User', stories: true, tests: true }))
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({
    componentName: 'cell',
    filesFn: files,
    name: 'User',
    stories: true,
    tests: true,
  })
  t.options.renderer = 'silent'

  await t.run()

  const generatedFiles = Object.keys(
    await files({ name: 'User', stories: true, tests: true })
  )
  expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
  generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
})
