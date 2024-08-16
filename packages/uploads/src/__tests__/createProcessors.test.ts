import { describe, it, expect } from 'vitest'

import {
  createFileListProcessor,
  createUploadProcessors,
} from '../createProcessors.js'
import { MemoryStorage } from '../MemoryStorage.js'
import type { UploadsConfig } from '../prismaExtension.js'

const memStore = new MemoryStorage({
  baseDir: '/memory_store_basedir',
})

// @TODO(TS): How can I make this accept not all model names?
// This is error-ing out because it wants all the models in my prisma client
const uploadsConfig: UploadsConfig = {
  dumbo: {
    fields: ['firstUpload', 'secondUpload'],
  },
  dummy: {
    fields: 'uploadField',
  },
}

describe('Create processors', () => {
  const processors = createUploadProcessors(uploadsConfig, memStore)

  it('should create processors with CapitalCased model name', () => {
    expect(processors.processDumboUploads).toBeDefined()
    expect(processors.processDummyUploads).toBeDefined()
  })

  it('Should replace file types with location strings', async () => {
    const data = {
      firstUpload: new File(['Meaow'], 'kitten.txt', {
        type: 'text/plain',
      }),
      secondUpload: new File(['Woof'], 'puppy.txt', {
        type: 'text/plain',
      }),
    }

    const result = await processors.processDumboUploads(data)

    // Location strings in this format: {baseDir/{model}-{field}-{ulid}.{ext}
    expect(result.firstUpload).toMatch(/\/memory_store_basedir\/dumbo-*.*\.txt/)
    expect(result.secondUpload).toMatch(
      /\/memory_store_basedir\/dumbo-*.*\.txt/,
    )

    const firstContents = await memStore.read(result.firstUpload)
    expect(firstContents.toString()).toBe('Meaow')

    const secondContents = await memStore.read(result.secondUpload)
    expect(secondContents.toString()).toBe('Woof')
  })

  it('Should be able to override save options', async () => {
    const data = {
      uploadField: new File(['Hello'], 'hello.png', {
        type: 'image/png',
      }),
    }

    const fileNameOverrideOnly = await processors.processDummyUploads(data, {
      fileName: 'overridden',
    })

    const pathOverrideOnly = await processors.processDummyUploads(data, {
      path: '/bazinga',
    })

    const bothOverride = await processors.processDummyUploads(data, {
      path: '/bazinga',
      fileName: 'overridden',
    })

    expect(fileNameOverrideOnly.uploadField).toBe(
      '/memory_store_basedir/overridden.png',
    )

    expect(pathOverrideOnly.uploadField).toMatch(/\/bazinga\/.*\.png/)
    // Overriding path ignores the baseDir
    expect(pathOverrideOnly.uploadField).not.toContain('memory_store_basedir')

    expect(bothOverride.uploadField).toBe('/bazinga/overridden.png')
  })

  it('Should not add extension for unknown file type', async () => {
    const data = {
      uploadField: new File(['Hello'], 'hello', {
        type: 'bazinga/unknown',
      }),
    }

    const noOverride = await processors.processDummyUploads(data)

    // No extension
    expect(noOverride.uploadField).toMatch(/\/memory_store_basedir\/.*[^.]+$/)

    const withOverride = await processors.processDummyUploads(data, {
      fileName: 'hello',
    })
    expect(withOverride.uploadField).toMatch(/[^.]+$/)
    expect(withOverride.uploadField).toBe('/memory_store_basedir/hello')
  })
})
// FileLists
// Problem is - in the database world, a string[] is not a thing
// so we need a generic way of doing this
describe('FileList processing', () => {
  const fileListProcessor = createFileListProcessor(memStore)

  const notPrismaData = [
    new File(['Hello'], 'hello.png', {
      type: 'image/png',
    }),
    new File(['World'], 'world.jpeg', {
      type: 'image/jpeg',
    }),
  ]

  it('Should handle FileLists', async () => {
    const result = await fileListProcessor(notPrismaData)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatch(/\/memory_store_basedir\/.*\.png/)
    expect(result[1]).toMatch(/\/memory_store_basedir\/.*\.jpeg/)
  })

  it('Should handle FileLists with SaveOptions', async () => {
    const result = await fileListProcessor(notPrismaData, {
      path: '/bazinga_not_mem_store',
    })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatch(/\/bazinga_not_mem_store\/.*\.png/)
    expect(result[1]).toMatch(/\/bazinga_not_mem_store\/.*\.jpeg/)
  })
})
