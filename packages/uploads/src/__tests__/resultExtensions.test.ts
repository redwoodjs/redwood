import { describe, it, expect, vi } from 'vitest'

import { setupUploads } from '../index.js'
import { MemoryStorage } from '../MemoryStorage.js'
import type { UploadsConfig } from '../prismaExtension.js'
import { UrlSigner } from '../signedUrls.js'

// @MARK: use the local prisma client in the test
import { PrismaClient } from './prisma-client/index.js'

vi.mock('@redwoodjs/project-config', async (importOriginal) => {
  const originalProjectConfig = (await importOriginal()) as any
  return {
    ...originalProjectConfig,
    getConfig: () => {
      return {
        web: {
          apiUrl: '/.redwood/functions',
        },
      }
    },
  }
})

describe('Result extensions', () => {
  const uploadConfig: UploadsConfig = {
    dummy: {
      fields: 'uploadField',
    },
    dumbo: {
      fields: ['firstUpload', 'secondUpload'],
    },
  }

  const { prismaExtension } = setupUploads(
    uploadConfig,
    new MemoryStorage({
      baseDir: '/tmp',
    }),
    new UrlSigner({
      endpoint: '/signed-url',
      secret: 'my-sekret',
    }),
  )

  const prismaClient = new PrismaClient().$extends(prismaExtension)

  describe('withSignedUrl', () => {
    it('Generates signed urls for each upload field', async () => {
      const dumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: '/dumbo/first.txt',
          secondUpload: '/dumbo/second.txt',
        },
      })

      const signedUrlDumbo = await dumbo.withSignedUrl(254)
      expect(signedUrlDumbo.firstUpload).toContain(
        '/.redwood/functions/signed-url',
      )
      expect(signedUrlDumbo.firstUpload).toContain('path=%2Fdumbo%2Ffirst.txt')
      expect(signedUrlDumbo.secondUpload).toContain(
        'path=%2Fdumbo%2Fsecond.txt',
      )
    })
  })
})
