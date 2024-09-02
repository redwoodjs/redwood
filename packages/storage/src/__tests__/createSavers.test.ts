import { describe, it, expect } from 'vitest'

import { ensurePosixPath } from '@redwoodjs/project-config'

import { MemoryStorage } from '../adapters/MemoryStorage/MemoryStorage.js'
import { createUploadSavers } from '../createProcessors.js'
import type { UploadsConfig } from '../prismaExtension.js'

const memStore = new MemoryStorage({
  baseDir: '/memory_store_basedir',
})

const uploadsConfig: UploadsConfig = {
  dumbo: {
    fields: ['firstUpload', 'secondUpload'],
  },
  dummy: {
    fields: 'uploadField',
  },
}

describe('Create processors', () => {
  const fileToStorage = createUploadSavers(uploadsConfig, memStore)

  it('should create processors with CapitalCased model name', () => {
    expect(fileToStorage.forDumbo).toBeDefined()
    expect(fileToStorage.forDummy).toBeDefined()

    // These are in the schema but not in the config
    expect(fileToStorage.forBook).not.toBeDefined()
    expect(fileToStorage.forNoUploadFields).not.toBeDefined()
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

    const result = await fileToStorage.forDumbo(data)

    // Location strings in this format: {baseDir/{model}-{field}-{ulid}.{ext}
    expect(ensurePosixPath(result.firstUpload)).toMatch(
      /\/memory_store_basedir\/dumbo-*.*\.txt/,
    )
    expect(ensurePosixPath(result.secondUpload)).toMatch(
      /\/memory_store_basedir\/dumbo-*.*\.txt/,
    )

    const { contents: firstContents } = await memStore.read(result.firstUpload)
    expect(firstContents.toString()).toBe('Meaow')

    const { contents: secondContents } = await memStore.read(
      result.secondUpload,
    )
    expect(secondContents.toString()).toBe('Woof')
  })

  it('Should be able to override save options', async () => {
    const data = {
      uploadField: new File(['Hello'], 'hello.png', {
        type: 'image/png',
      }),
    }

    const fileNameOverrideOnly = await fileToStorage.forDummy(data, {
      fileName: 'overridden',
    })

    const pathOverrideOnly = await fileToStorage.forDummy(data, {
      path: '/bazinga',
    })

    const bothOverride = await fileToStorage.forDummy(data, {
      path: '/bazinga',
      fileName: 'overridden',
    })

    expect(ensurePosixPath(fileNameOverrideOnly.uploadField)).toBe(
      '/memory_store_basedir/overridden.png',
    )

    expect(ensurePosixPath(pathOverrideOnly.uploadField)).toMatch(
      /\/bazinga\/.*\.png/,
    )
    // Overriding path ignores the baseDir
    expect(pathOverrideOnly.uploadField).not.toContain('memory_store_basedir')

    expect(ensurePosixPath(bothOverride.uploadField)).toBe(
      '/bazinga/overridden.png',
    )
  })

  it('Should not add extension for unknown file type', async () => {
    const data = {
      uploadField: new File(['Hello'], 'hello', {
        type: 'bazinga/unknown', // we don't use this anyway
      }),
    }

    const noOverride = await fileToStorage.forDummy(data)

    // No extension
    expect(ensurePosixPath(noOverride.uploadField)).toMatch(
      /\/memory_store_basedir\/.*[^.]+$/,
    )

    const withOverride = await fileToStorage.forDummy(data, {
      fileName: 'hello',
    })

    expect(withOverride.uploadField).toMatch(/[^.]+$/)
    expect(ensurePosixPath(withOverride.uploadField)).toBe(
      '/memory_store_basedir/hello',
    )
  })
})
// FileLists
// Problem is - in the database world, a string[] is not a thing
// so we need a generic way of doing this
describe('FileList processing', () => {
  const processors = createUploadSavers(uploadsConfig, memStore)

  const notPrismaData = [
    new File(['Hello'], 'hello.png', {
      type: 'image/png',
    }),
    new File(['World'], 'world.jpeg', {
      type: 'image/jpeg',
    }),
  ]

  it('Should handle FileLists', async () => {
    const result = await processors.inList(notPrismaData)

    expect(result).toHaveLength(2)

    expect(ensurePosixPath(result[0])).toMatch(
      /\/memory_store_basedir\/.*\.png/,
    )
    expect(ensurePosixPath(result[1])).toMatch(
      /\/memory_store_basedir\/.*\.jpeg/,
    )
  })

  it('Should handle FileLists with SaveOptions', async () => {
    const result = await processors.inList(notPrismaData, {
      path: '/bazinga_not_mem_store',
    })

    expect(result).toHaveLength(2)
    expect(ensurePosixPath(result[0])).toMatch(
      /\/bazinga_not_mem_store\/.*\.png/,
    )
    expect(ensurePosixPath(result[1])).toMatch(
      /\/bazinga_not_mem_store\/.*\.jpeg/,
    )
  })

  it('Should handle empty FileLists', async () => {
    const promise = processors.inList()

    await expect(promise).resolves.not.toThrow()
  })
})
