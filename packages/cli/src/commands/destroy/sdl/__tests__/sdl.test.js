global.__dirname = __dirname

import fs from 'fs'

import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { builder, files } from '../../../generate/sdl/sdl'
import { tasks } from '../sdl'

jest.mock('fs')
jest.mock('@babel/core', () => {
  return {
    transform: () => ({
      code: '',
    }),
  }
})

jest.mock('../../../../lib', () => {
  const path = require('path')
  return {
    ...jest.requireActual('../../../../lib'),
    generateTemplate: () => '',
    getSchema: () =>
      require(path.join(global.__dirname, 'fixtures', 'post.json')),
  }
})

describe('rw destory sdl', () => {
  afterEach(() => {
    fs.__setMockFiles({})
    jest.spyOn(fs, 'unlinkSync').mockClear()
  })

  describe('for javascipt files', () => {
    beforeEach(async () => {
      fs.__setMockFiles(
        await files({ ...getDefaultArgs(builder), name: 'Post' })
      )
    })

    test('destroys sdl files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
      const t = tasks({ model: 'Post' })
      t.setRenderer('silent')

      return t._tasks[0].run().then(async () => {
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
      t.setRenderer('silent')

      return t._tasks[0].run().then(async () => {
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
