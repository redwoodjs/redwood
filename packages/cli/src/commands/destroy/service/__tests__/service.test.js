global.__dirname = __dirname
import fs from 'fs'

import 'src/lib/test'

import { getDefaultArgs } from '../../../../lib'
import { builder, files } from '../../../generate/service/service'
import { tasks } from '../service'

jest.mock('fs')
jest.mock('@babel/core', () => {
  return {
    transform: () => ({
      code: '',
    }),
  }
})
jest.mock('src/lib', () => {
  const path = require('path')
  return {
    ...jest.requireActual('src/lib'),
    generateTemplate: () => '',
    getSchema: () =>
      require(path.join(global.__dirname, 'fixtures', 'post.json')),
  }
})

describe('rw destory service', () => {
  afterEach(() => {
    fs.__setMockFiles({})
    jest.spyOn(fs, 'unlinkSync').mockClear()
  })

  describe('for javascript files', () => {
    beforeEach(async () => {
      fs.__setMockFiles(
        await files({ ...getDefaultArgs(builder), name: 'User' })
      )
    })
    test('destroys service files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
      const t = tasks({
        componentName: 'service',
        filesFn: files,
        name: 'User',
      })
      t.setRenderer('silent')

      return t.run().then(async () => {
        const generatedFiles = Object.keys(
          await files({ ...getDefaultArgs(builder), name: 'User' })
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
          name: 'User',
        })
      )
    })

    test('destroys service files', async () => {
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync')
      const t = tasks({
        componentName: 'service',
        filesFn: files,
        name: 'User',
      })
      t.setRenderer('silent')

      return t.run().then(async () => {
        const generatedFiles = Object.keys(
          await files({
            ...getDefaultArgs(builder),
            typescript: true,
            name: 'User',
          })
        )
        expect(generatedFiles.length).toEqual(unlinkSpy.mock.calls.length)
        generatedFiles.forEach((f) => expect(unlinkSpy).toHaveBeenCalledWith(f))
      })
    })
  })
})
