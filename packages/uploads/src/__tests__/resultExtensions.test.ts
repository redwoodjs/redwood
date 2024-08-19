import { describe, it, beforeAll, expect } from 'vitest'

import { MemoryStorage } from '../MemoryStorage.js'
import type { UploadsConfig } from '../prismaExtension.js'
import { setupUploads } from '../setup.js'

// @MARK: use the local prisma client in the test
import { PrismaClient } from './prisma-client/index.js'

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
  )

  const prismaClient = new PrismaClient().$extends(prismaExtension)

  describe('withSignedUrl', () => {
    beforeAll(() => {
      process.env.RW_UPLOADS_SECRET = 'gasdg'
    })
    it('Generates signed urls for each upload field', async () => {
      const dumbo = await prismaClient.dumbo.create({
        data: {
          firstUpload: '/dumbo/first.txt',
          secondUpload: '/dumbo/second.txt',
        },
      })

      const signedUrlDumbo = await dumbo.withSignedUrl()
      expect(signedUrlDumbo.firstUpload).toContain('path=%2Fdumbo%2Ffirst.txt')
      expect(signedUrlDumbo.secondUpload).toContain(
        'path=%2Fdumbo%2Fsecond.txt',
      )
    })

    it('laskdng', async () => {
      const customClient = new PrismaClient().$extends({
        result: {
          dumbo: {
            helloJosh: {
              compute() {
                return () => {
                  return 'hello josh'
                }
              },
            },
          },
        },
      })

      const dumbo = await customClient.dumbo.findFirst({ where: { id: 1 } })
      dumbo?.helloJosh()
    })
  })
})
