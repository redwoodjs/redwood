
import { describe, it, expect } from 'vitest'

import { createUploadProcessors } from '../createProcessors.js'
import { MemoryStorage } from '../MemoryStorage.js'

const memStore = new MemoryStorage({
  baseDir: '/memory_store_basedir'
})

const uploadsConfig = {
  dumbo: {
    fields: ['firstUpload', 'secondUpload'],
  },
  dummy: {
    fields: 'uploadField',
  },
}

describe('Create processors', () => {
  const processors = createUploadProcessors(memStore, uploadsConfig)

  it('should create processors with CapitalCased model name', () => {
    expect(processors.processDumboUploads).toBeDefined()
    expect(processors.processDummyUploads).toBeDefined()
  })

  it('Should replace file types with location strings', async() => {
    const data = {
      firstUpload: new File(['Meaow'], 'kitten.txt', {
        type: 'text/plain',
      }),
      secondUpload: new File(['Woof'], 'puppy.txt', {
        type: 'text/plain',
      }),
    }

    const result = await processors.processDumboUploads(data)

    expect(result.firstUpload).toMatch(/\/memory_store_basedir\/.*\.txt/)
    expect(result.secondUpload).toMatch(/\/memory_store_basedir\/.*\.txt/)

    const firstContents = await memStore.read(result.firstUpload)
    expect(firstContents.toString()).toBe('Meaow')

    const secondContents = await memStore.read(result.secondUpload)
    expect(secondContents.toString()).toBe('Woof')
  })

  it('Should be able to override save options', async() => {
    const data = {
      uploadField: new File(['Hello'], 'hello.png', {
        type: 'image/png',
      }),
    }

    const fileNameOverrideOnly = await processors.processDummyUploads(data, {
      fileName: 'overridden.txt',
  })

  const pathOverrideOnly = await processors.processDummyUploads(data, {
    path: '/bazinga',
})

const bothOverride = await processors.processDummyUploads(data, {
  path: '/bazinga',
  fileName: 'overridden.png',
})

  expect(fileNameOverrideOnly.uploadField).toBe('/memory_store_basedir/overridden.txt') // 👈 overrode the extension too

  expect(pathOverrideOnly.uploadField).toMatch(/\/bazinga\/.*\.png/)
  // Overriding path ignores the baseDir
  expect(pathOverrideOnly.uploadField).not.toContain('memory_store_basedir')


  expect(bothOverride.uploadField).toBe('/bazinga/overridden.png')
})

it('Should not add extension for unknown file type', async() => {
  const data = {
    uploadField: new File(['Hello'], 'hello', {
      type: 'bazinga/unknown',
    }),
  }

  const noOverride = await processors.processDummyUploads(data)

  // No extension
  expect(noOverride.uploadField).toMatch(/\/memory_store_basedir\/.*[^.]+$/);

  const withOverride = await processors.processDummyUploads(data, {
    fileName: 'hello',
  })
  expect(withOverride.uploadField).toMatch(/[^.]+$/);
  expect(withOverride.uploadField).toBe('/memory_store_basedir/hello')

})


})