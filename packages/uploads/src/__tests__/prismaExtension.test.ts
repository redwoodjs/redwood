import fs from 'node:fs/promises'

import { describe, it, vi, expect, beforeEach } from 'vitest'

import { FileSystemStorage } from '../FileSystemStorage.js'
import type { UploadsConfig } from '../prismaExtension.js'
import { setupUploads } from '../setup.js'

// @MARK: use the local prisma client
import { PrismaClient } from './prisma-client'

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
    readFile: vi.fn(() => {
      return 'MOCKED_FILE_CONTENT'
    }),
    copyFile: vi.fn(),
  },
}))

describe('Uploads Prisma Extension', () => {
  const dummyUploadConfig = {
    fields: 'uploadField',
  }

  const dumboUploadConfig = {
    fields: ['firstUpload', 'secondUpload'],
  }

  const uploadConfig: UploadsConfig = {
    dummy: dummyUploadConfig,
    dumbo: dumboUploadConfig,
  }

  const { prismaExtension, uploadsProcessors } = setupUploads(
    uploadConfig,
    new FileSystemStorage({
      baseDir: '/tmp',
    }),
  )

  const prismaClient = new PrismaClient().$extends(prismaExtension)

  describe('Query extensions', () => {
    beforeEach(() => {
      vi.resetAllMocks()
    })

    const sampleFile = new File(['heres-some-content'], 'dummy.txt', {
      type: 'text/plain',
    })

    describe('create', () => {
      it('create will save files', async () => {
        const processedData = await uploadsProcessors.processDummyUploads({
          uploadField: sampleFile,
        })

        expect(fs.writeFile).toHaveBeenCalled()
        const dummy = await prismaClient.dummy.create({
          data: processedData,
        })

        expect(dummy).toMatchObject({
          uploadField: expect.stringMatching(/\/tmp\/.*\.txt$/),
        })
      })

      it('will remove the file if the create fails', async () => {
        try {
          await prismaClient.dumbo.create({
            data: {
              firstUpload: '/tmp/first.txt',
              secondUpload: '/bazinga/second.txt',
              // @ts-expect-error Checking the error here
              id: 'this-is-the-incorrect-type',
            },
          })
        } catch {
          expect(fs.unlink).toHaveBeenNthCalledWith(1, '/tmp/first.txt')
          expect(fs.unlink).toHaveBeenNthCalledWith(2, '/bazinga/second.txt')
        }

        expect.assertions(2)
      })
    })

    describe('createMany', () => {
      it('createMany will remove files if all the create fails', async () => {
        try {
          await prismaClient.dumbo.createMany({
            data: [
              {
                firstUpload: '/one/first.txt',
                secondUpload: '/one/second.txt',
                id: 'break',
              },
              {
                firstUpload: '/two/first.txt',
                secondUpload: '/two/second.txt',
                id: 'break2',
              },
            ],
          })
        } catch (e) {
          expect(fs.unlink).toHaveBeenCalledTimes(4)
          expect(fs.unlink).toHaveBeenNthCalledWith(1, '/one/first.txt')
          expect(fs.unlink).toHaveBeenNthCalledWith(2, '/one/second.txt')
          expect(fs.unlink).toHaveBeenNthCalledWith(3, '/two/first.txt')
          expect(fs.unlink).toHaveBeenNthCalledWith(4, '/two/second.txt')
        }

        expect.assertions(4)
      })

      it('createMany will remove files from only the creates that fail', async () => {
        try {
          await prismaClient.dumbo.createMany({
            data: [
              // This one will go through
              {
                firstUpload: '/one/first.txt',
                secondUpload: '/one/second.txt',
              },
              {
                firstUpload: '/two/first.txt',
                secondUpload: '/two/second.txt',
                id: 'break2',
              },
            ],
          })
        } catch (e) {
          console.log(e)
          expect(fs.unlink).toHaveBeenCalledTimes(2)
          expect(fs.unlink).toHaveBeenNthCalledWith(1, '/two/first.txt')
          expect(fs.unlink).toHaveBeenNthCalledWith(2, '/two/second.txt')
        }

        expect.assertions(4)
      })
    })

    // describe('update', () => {})

    // describe('delete', () => {})
  })

  describe('Result extensions', () => {
    it('will return a data URL for the file', async () => {})

    // @TODO Handle edge cases (file removed, data modified, etc.)
    // it('if file is not found, will throw an error', async () => {})
    // it('if saved file is not a path, will throw an error', async () => {})
  })
})
