import { expect, test } from 'tstyche'

import { createUploadsConfig, setupStorage } from 'src/index.js'

import { MemoryStorage } from '../adapters/MemoryStorage/MemoryStorage.js'
import type { ModelNames } from '../prismaExtension.js'
import { type UploadsConfig } from '../prismaExtension.js'

// Use the createUplodsConfig helper here....
// otherwise the types won't be accurate
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
  expect(saveFiles).type.not.toHaveProperty('forBookCover')
})

test('inline config for save files is OK!', () => {
  const { saveFiles } = setupStorage({
    uploadsConfig: {
      bookCover: {
        fields: 'photo',
      },
    },
    storageAdapter: new MemoryStorage({
      baseDir: '/tmp',
    }),
  })

  expect(saveFiles).type.toHaveProperty('forBookCover')
  expect(saveFiles).type.not.toHaveProperty('forDummy')
  expect(saveFiles).type.not.toHaveProperty('forDumbo')
})

test('UploadsConfig accepts all available models with their fields', async () => {
  type ConfiguredUploadsConfig = UploadsConfig<ModelNames>

  expect<ConfiguredUploadsConfig>().type.toHaveProperty('dummy')
  expect<ConfiguredUploadsConfig>().type.toHaveProperty('dumbo')
  expect<ConfiguredUploadsConfig>().type.toHaveProperty('book')
  expect<ConfiguredUploadsConfig>().type.toHaveProperty('bookCover')
  expect<ConfiguredUploadsConfig>().type.toHaveProperty('noUploadFields')

  expect<ConfiguredUploadsConfig['dumbo']>().type.toBeAssignableWith<{
    fields: ['firstUpload'] // one of the fields, but not all of them
  }>()

  expect<ConfiguredUploadsConfig['dumbo']>().type.toBeAssignableWith<{
    fields: ['firstUpload', 'secondUpload'] // one of the fields, but not all of them
  }>()

  expect<ConfiguredUploadsConfig['bookCover']>().type.toBeAssignableWith<{
    fields: ['photo']
  }>()

  // If you give it something else, it won't accept it
  expect<ConfiguredUploadsConfig['bookCover']>().type.not.toBeAssignableWith<{
    fields: ['bazinga']
  }>()
})
