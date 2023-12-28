globalThis.__dirname = __dirname

import fs from 'fs-extra'

import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { builder, files } from '../../../generate/sdl/sdl'
import { tasks } from '../sdl'

jest.mock('fs')

jest.mock('../../../../lib', () => {
  return {
    ...jest.requireActual('../../../../lib'),
    generateTemplate: () => '',
  }
})

jest.mock('../../../../lib/schemaHelpers', () => {
  const path = require('path')
  return {
    ...jest.requireActual('../../../../lib/schemaHelpers'),
    getSchema: () =>
      require(path.join(globalThis.__dirname, 'fixtures', 'post.json')),
  }
})

describe('rw destroy sdl', () => {
  afterEach(() => {
    fs.__setMockFiles({})
    jest.spyOn(fs, 'unlinkSync').mockClear()
  })

  describe('for javascript files', () => {
    beforeEach(async () => {
      fs.__setMockFiles(
        await files({ ...getDefaultArgs(builder), name: 'Post' })
      )
    })

    test('destroys sdl files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
      const t = tasks({ model: 'Post' })
      t.options.renderer = 'silent'

      return t.tasks[0].run().then(async () => {
        const generatedFiles = Object.keys(
          await files({ ...getDefaultArgs(builder), name: 'Post' })
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })
  })

  describe('for typescript files', () => {
    beforeEach(async () => {
      fs.__setMockFiles(
        await files({
          ...getDefaultArgs(builder),
          typescript: true,
          name: 'Post',
        })
      )
    })

    test('destroys sdl files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
      const t = tasks({ model: 'Post' })
      t.options.renderer = 'silent'

      return t.tasks[0].run().then(async () => {
        const generatedFiles = Object.keys(
          await files({
            ...getDefaultArgs(builder),
            typescript: true,
            name: 'Post',
          })
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })
  })
})
