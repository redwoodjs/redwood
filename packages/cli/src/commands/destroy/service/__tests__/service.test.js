globalThis.__dirname = __dirname
import fs from 'fs-extra'

import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { builder, files } from '../../../generate/service/service'
import { tasks } from '../service'

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

describe('rw destroy service', () => {
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
      t.options.renderer = 'silent'

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
      t.options.renderer = 'silent'

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
