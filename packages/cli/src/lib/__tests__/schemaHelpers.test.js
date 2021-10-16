global.__dirname = __dirname
jest.mock('@redwoodjs/internal', () => {
  const path = require('path')
  return {
    ...jest.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      const BASE_PATH = path.join(global.__dirname, 'fixtures')
      return {
        base: BASE_PATH,
        api: {
          db: BASE_PATH, // this folder
        },
      }
    },
  }
})

import prompts from 'prompts'

import { getSchema, verifyModelName } from '../schemaHelpers'

test('getSchema returns a parsed schema.prisma', async () => {
  let schema = await getSchema('Post')
  expect(schema.fields[0].name).toEqual('id')
  expect(schema.fields[1].name).toEqual('title')
  expect(schema.fields[2].name).toEqual('slug')

  // can get a different model
  schema = await getSchema('User')
  expect(schema.fields[0].name).toEqual('id')
  expect(schema.fields[1].name).toEqual('name')
  expect(schema.fields[2].name).toEqual('email')
})

test('getSchema throws an error if model name not found', async () => {
  let error

  try {
    await getSchema('Foo')
  } catch (e) {
    error = e
  }

  expect(error).toEqual(new Error(error.message))
})

test('verifyModelName', async () => {
  let modelName

  modelName = await verifyModelName({ name: 'User' })
  expect(modelName).toEqual({ name: 'User' })

  modelName = await verifyModelName({ name: 'user' })
  expect(modelName).toEqual({ name: 'User' })

  prompts.inject('CustomDatas')
  modelName = await verifyModelName({ name: 'CustomData' })
  expect(modelName).toEqual({ name: 'CustomData' })

  prompts.inject('CustomDatas')
  modelName = await verifyModelName({ name: 'customData' })
  expect(modelName).toEqual({ name: 'CustomData' })
})
