import { expect, test } from 'tstyche'

import { setupStorage } from 'src/index.js'

import { MemoryStorage } from '../adapters/MemoryStorage/MemoryStorage.js'
import { createUploadsConfig, type UploadsConfig } from '../prismaExtension.js'

// Define uploadsConfig with suggestions for keys
const uploadsConfig = createUploadsConfig({
  dummy: {
    fields: 'uploadField',
  },
  dumbo: {
    fields: ['firstUpload', 'secondUpload'],
  },
})

const { saveFiles } = setupStorage({
  uploadsConfig,
  storageAdapter: new MemoryStorage({
    baseDir: '/tmp',
  }),
})

// const prismaClient = new PrismaClient().$extends(storagePrismaExtension)

test('only configured models have savers', async () => {
  expect(saveFiles).type.toHaveProperty('forDummy')
  expect(saveFiles).type.toHaveProperty('forDumbo')

  // These weren't configured above
  expect(saveFiles).type.not.toHaveProperty('forNoUploadFields')
  expect(saveFiles).type.not.toHaveProperty('forBook')
  // expect(saveFiles).type.not.toHaveProperty('forBookCover')
})

test('UploadsConfig accepts all available models with their fields', async () => {
  expect<UploadsConfig>().type.toHaveProperty('dummy')
  expect<UploadsConfig>().type.toHaveProperty('dumbo')
  expect<UploadsConfig>().type.toHaveProperty('book')
  expect<UploadsConfig>().type.toHaveProperty('bookCover')
  expect<UploadsConfig>().type.toHaveProperty('noUploadFields')

  expect<UploadsConfig['dumbo']>().type.toBeAssignableWith<{
    fields: ['firstUpload'] // one of the fields, but not all of them
  }>()

  expect<UploadsConfig['dumbo']>().type.toBeAssignableWith<{
    fields: ['firstUpload', 'secondUpload'] // one of the fields, but not all of them
  }>()

  expect<UploadsConfig['bookCover']>().type.toBeAssignableWith<{
    fields: ['photo']
  }>()

  // If you give it something else, it won't accept it
  expect<UploadsConfig['bookCover']>().type.not.toBeAssignableWith<{
    fields: ['bazinga']
  }>()
})
