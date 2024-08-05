import fs from 'node:fs/promises'

import { PrismaClient } from '@prisma/client'
import { describe, it, vi, expect } from 'vitest'

import { createUploadsExtension } from '../prismaExtension'

import { dataUrlPng } from './fileMocks'

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
  },
}))

describe('Uploads Prisma Extension', () => {
  const dummyUploadConfig = {
    fields: 'uploadField',
    savePath: '/bazinga',
    onFileSaved: vi.fn(),
  }

  const dumboUploadConfig = {
    fields: ['firstUpload', 'secondUpload'],
    savePath: '/dumbo',
    onFileSaved: vi.fn(),
  }
  const prismaClient = new PrismaClient().$extends(
    createUploadsExtension({
      dummy: dummyUploadConfig,
      dumbo: dumboUploadConfig,
    }),
  )

  describe('Query extensions', () => {
    it('will create a file with base64 encoded png', async () => {
      const dum1 = await prismaClient.dummy.create({
        data: {
          uploadField: dataUrlPng,
        },
      })

      expect(dummyUploadConfig.onFileSaved).toHaveBeenCalled()
      expect(dum1.uploadField).toMatch(/bazinga\/.*\.png/)
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/bazinga\/.*\.png/),
        expect.anything(), // no need to check content here, makes test slow
      )
    })

    it('handles multiple upload fields', async () => {
      const dumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: dataUrlPng,
          secondUpload: dataUrlPng,
        },
      })

      expect(dumbo.firstUpload).toMatch(/dumbo\/.*\.png/)
      expect(dumbo.secondUpload).toMatch(/dumbo\/.*\.png/)

      expect(dumboUploadConfig.onFileSaved).toHaveBeenCalledTimes(2)
    })

    it('handles empty fields', async () => {
      const emptyUploadFieldPromise = prismaClient.dummy.create({
        data: {
          uploadField: '',
        },
      })

      await expect(emptyUploadFieldPromise).resolves.not.toThrow()
    })

    // @TODO implement these tests
    // it('handles updates, and removes old files', async () => {})

    // it('handles deletes, and removes files', async () => {})

    // it('supports custom file name functions', async () => {})

    // it('supports custom save path functions', async () => {})

    // it('will move file to new location with TUS uploads', async () => {})

    // it('will remove old file when updating with TUS uploads', async () => {})

    // it('will remove file when deleting with TUS uploads', async () => {})
  })

  describe('Result extensions', () => {
    it('will return a data URL for the file', async () => {})
    // @TODO implement
    // it('will return a public URL for the file', async () => {})
    // it('if file is not found, will throw an error', async () => {})
    // it('if saved file is not a path, will throw an error', async () => {})
  })
})
