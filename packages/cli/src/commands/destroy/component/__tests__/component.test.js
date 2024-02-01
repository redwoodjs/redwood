globalThis.__dirname = __dirname
vi.mock('fs-extra')
vi.mock('../../../../lib', async (importOriginal) => {
  const originalLib = await importOriginal()
  return {
    ...originalLib,
    generateTemplate: () => '',
  }
})

import fs from 'fs-extra'
import { vol } from 'memfs'
import { vi, beforeEach, afterEach, test, expect } from 'vitest'

import '../../../../lib/test'

import { files } from '../../../generate/component/component'
import { tasks } from '../component'

beforeEach(() => {
  vol.fromJSON(files({ name: 'About' }))
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vol.reset()
  vi.spyOn(fs, 'unlinkSync').mockClear()
  console.info.mockRestore()
  console.log.mockRestore()
})

test('destroys component files', async () => {
  const unlinkSpy = vi.spyOn(fs, 'unlinkSync')
  const t = tasks({ componentName: 'component', filesFn: files, name: 'About' })
  t.options.renderer = 'silent'

  return t.run().then(() => {
    const generatedFiles = Object.keys(files({ name: 'About' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})

test('destroys component files including stories and tests', async () => {
  vol.fromJSON(files({ name: 'About', stories: true, tests: true }))
  const unlinkSpy = vi.spyOn(fs, 'unlinkSync')
  const t = tasks({
    componentName: 'component',
    filesFn: files,
    name: 'About',
    stories: true,
    tests: true,
  })
  t.options.renderer = 'silent'

  return t.run().then(() => {
    const generatedFiles = Object.keys(
      files({ name: 'About', stories: true, tests: true })
    )
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
