import fs from 'node:fs/promises'

import { vol } from 'memfs'
import { describe, it, vi, expect } from 'vitest'

import { FileSystemStorage } from '../FileSystemStorage.js'
import { createUploadsExtension } from '../prismaExtension.js'

import { dataUrlPng } from './fileMocks.js'
// @MARK: use the local prisma client
import { PrismaClient } from './prisma-client'

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile: vi.fn(),
    unlink: vi.fn(),
    readFile: vi.fn((path, encoding) => {
      if (encoding === 'base64') {
        return 'BASE64_FILE_CONTENT'
      }

      return 'MOCKED_FILE_CONTENT'
    }),
    copyFile: vi.fn(),
  },
}))

vol.fromJSON({
  '/tmp/tus-uploads/123.json': '{}',
  '/tmp/tus-uploads/ABCD.json': '{}',
})

describe('Uploads Prisma Extension', () => {
  const dummyUploadConfig = {
    fields: 'uploadField',
  }

  const dumboUploadConfig = {
    fields: ['firstUpload', 'secondUpload'],
  }

  const prismaClient = new PrismaClient().$extends(
    createUploadsExtension(
      {
        dummy: dummyUploadConfig,
        dumbo: dumboUploadConfig,
      },
      // Test with file system storage, and mock the fs calls
      new FileSystemStorage({
        baseDir: '/tmp',
      }),
    ),
  )

  describe('Query extensions', () => {
    it.only('will create a file with base64 encoded png', async () => {
      const file = new File(['hello'], 'hello.txt', {
        type: 'text/plain',
      })
      console.log(`👉 \n ~ file:`, file)
      console.log(`👉 \n ~ file arraybuf:`, await file.arrayBuffer())

      const dum1 = await prismaClient.dummy.create({
        data: {
          uploadField: file,
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

    it('handles updates, and removes old files', async () => {
      const dum1 = await prismaClient.dummy.create({
        data: {
          uploadField: dataUrlPng,
        },
      })

      const originalPath = dum1.uploadField

      const dum2 = await prismaClient.dummy.update({
        where: { id: dum1.id },
        data: {
          uploadField: dataUrlPng,
        },
      })

      expect(dum2.uploadField).not.toEqual(originalPath)
      expect(dum2.uploadField).toMatch(/bazinga\/.*\.png/)
      expect(fs.unlink).toHaveBeenCalledWith(originalPath)
    })

    it('handles deletes, and removes files', async () => {
      const dum1 = await prismaClient.dummy.create({
        data: {
          uploadField: dataUrlPng,
        },
      })

      await prismaClient.dummy.delete({
        where: { id: dum1.id },
      })

      expect(fs.unlink).toHaveBeenCalledWith(dum1.uploadField)
    })

    it('supports custom file name and save path functions', async () => {
      const customNameConfig = {
        fields: 'firstUpload',
        savePath: '/custom',
        onFileSaved: vi.fn(),
        fileName: (args) => {
          // 👇 Using args here
          return `my-name-is-dumbo-${args.data.id}`
        },
      }

      const clientWithFileName = new PrismaClient().$extends(
        createUploadsExtension(
          {
            dumbo: customNameConfig,
          },
          new FileSystemStorage(),
        ),
      )

      const dumbo = await clientWithFileName.dumbo.create({
        data: {
          firstUpload: dataUrlPng,
          secondUpload: '',
          id: 55,
        },
      })

      expect(customNameConfig.onFileSaved).toHaveBeenCalled()
      expect(dumbo.firstUpload).toBe('/custom/my-name-is-dumbo-55.png')

      // Delete it to clean up
      await clientWithFileName.dumbo.delete({
        where: {
          id: 55,
        },
      })
    })


  describe('Result extensions', () => {
    it('will return a data URL for the file', async () => {
      const res1 = await (
        await prismaClient.dummy.create({
          data: {
            uploadField: dataUrlPng,
          },
        })
      ).withDataUri()

      // Mocked in FS mocks
      expect(res1.uploadField).toBe('data:image/png;base64,BASE64_FILE_CONTENT')
    })

    // @TODO Handle edge cases (file removed, data modified, etc.)
    // it('if file is not found, will throw an error', async () => {})
    // it('if saved file is not a path, will throw an error', async () => {})
  })
})
