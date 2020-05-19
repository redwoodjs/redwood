global.__dirname = __dirname
jest.mock('fs')
jest.mock('src/lib', () => {
  const path = require('path')
  return {
    ...require.requireActual('src/lib'),
    generateTemplate: () => '',
    getSchema: () =>
      require(path.join(global.__dirname, 'fixtures', 'post.json')),
  }
})

import fs from 'fs'

import 'src/lib/test'

import { files } from '../../../generate/sdl/sdl'
import { tasks } from '../sdl'

beforeEach(async () => {
  fs.__setMockFiles(await files({ name: 'Post' }))
})

afterEach(() => {
  fs.__setMockFiles({})
  jest.spyOn(fs, 'unlinkSync').mockClear()
})

test('destroys sdl files', async () => {
  const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
  const t = tasks({ model: 'Post' })
  t.setRenderer('silent')

  return t._tasks[0].run().then(async () => {
    const generatedFiles = Object.keys(await files({ name: 'Post' }))
    expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
    generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
  })
})
