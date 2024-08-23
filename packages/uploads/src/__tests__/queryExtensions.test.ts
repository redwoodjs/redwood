import fs from 'node:fs/promises'

import type { MockedFunction } from 'vitest'
import { describe, it, vi, expect, beforeEach, beforeAll } from 'vitest'

import { FileSystemStorage } from '../FileSystemStorage.js'
import { setupUploads } from '../index.js'
import type { UploadsConfig } from '../prismaExtension.js'

// @MARK: use the local prisma client in the test
import type { Dumbo, Dummy } from './prisma-client/index.js'
import { PrismaClient } from './prisma-client/index.js'

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

// For creation of FS adapter
vi.mock('node:fs', () => ({
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
}))

describe('Query extensions', () => {
  const uploadConfig: UploadsConfig = {
    dummy: {
      fields: 'uploadField',
    },
    dumbo: {
      fields: ['firstUpload', 'secondUpload'],
    },
  }

  const { prismaExtension, uploadsProcessors } = setupUploads(
    uploadConfig,
    new FileSystemStorage({
      baseDir: '/tmp',
    }),
  )

  const prismaClient = new PrismaClient().$extends(prismaExtension)

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

  describe('update', () => {
    let ogDummy: Dummy
    let ogDumbo: Dumbo
    beforeAll(async () => {
      ogDummy = await prismaClient.dummy.create({
        data: {
          uploadField: '/tmp/old.txt',
        },
      })

      ogDumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: '/tmp/oldFirst.txt',
          secondUpload: '/tmp/oldSecond.txt',
        },
      })
    })

    beforeEach(() => {
      vi.resetAllMocks()
    })

    it('update will remove the old file, save new one', async () => {
      const updatedDummy = await prismaClient.dummy.update({
        data: {
          uploadField: '/tmp/new.txt',
        },
        where: {
          id: ogDummy.id,
        },
      })

      expect(fs.unlink).toHaveBeenCalledWith('/tmp/old.txt')
      expect(updatedDummy.uploadField).toBe('/tmp/new.txt')
    })

    it('should not delete the file if the update fails', async () => {
      const failedUpdatePromise = prismaClient.dummy.update({
        data: {
          // @ts-expect-error Intentional
          id: 'this-is-the-incorrect-type',
        },
        where: {
          id: ogDummy.id,
        },
      })

      // Id is invalid, so the update should fail
      await expect(failedUpdatePromise).rejects.toThrowError()

      // The old one should NOT be deleted
      expect(fs.unlink).not.toHaveBeenCalled()
    })

    it('should only delete old files from the fields that are being updated', async () => {
      const updatedDumbo = await prismaClient.dumbo.update({
        data: {
          firstUpload: '/tmp/newFirst.txt',
        },
        where: {
          id: ogDumbo.id,
        },
      })

      expect(updatedDumbo.firstUpload).toBe('/tmp/newFirst.txt')
      expect(updatedDumbo.secondUpload).toBe('/tmp/oldSecond.txt')
      expect(fs.unlink).toHaveBeenCalledOnce()
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/oldFirst.txt')
    })

    it('should not delete files on update of non-upload fields', async () => {
      // In this case, we're only updating the message field
      await prismaClient.dumbo.update({
        data: {
          message: 'Hello world',
        },
        where: {
          id: ogDumbo.id,
        },
      })

      expect(fs.unlink).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('delete will remove all uploads', async () => {
      const dumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: '/tmp/first.txt',
          secondUpload: '/tmp/second.txt',
        },
      })

      await prismaClient.dumbo.delete({
        where: {
          id: dumbo.id,
        },
      })

      expect(fs.unlink).toHaveBeenCalledTimes(2)
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/first.txt')
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/second.txt')
    })

    it('Should handle if a bad path is provided', async () => {
      ;(fs.unlink as MockedFunction<typeof fs.unlink>).mockRejectedValueOnce(
        new Error('unlink error'),
      )

      const invalidPathDumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: '',
          secondUpload: 'im-a-invalid-path',
        },
      })

      const deletePromise = prismaClient.dumbo.delete({
        where: {
          id: invalidPathDumbo.id,
        },
      })

      await expect(deletePromise).resolves.not.toThrow()

      expect(fs.unlink).toHaveBeenCalledOnce()
      expect(fs.unlink).toHaveBeenCalledWith('im-a-invalid-path')
    })
  })
})
