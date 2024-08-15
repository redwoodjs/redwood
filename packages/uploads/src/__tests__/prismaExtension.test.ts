
import { vol } from 'memfs'
import { describe, it, vi } from 'vitest'

import { FileSystemStorage } from '../FileSystemStorage.js'
import { createUploadsExtension } from '../prismaExtension.js'

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
    it('not implemented yet after refactor')
  })


  describe('Result extensions', () => {
    it('will return a data URL for the file', async () => {
    })

    // @TODO Handle edge cases (file removed, data modified, etc.)
    // it('if file is not found, will throw an error', async () => {})
    // it('if saved file is not a path, will throw an error', async () => {})
  })
})
