global.__dirname = __dirname
jest.mock('@redwoodjs/internal', () => {
  const path = require('path')
  return {
    ...require.requireActual('@redwoodjs/internal'),
    getPaths: () => {
      const BASE_PATH = '/path/to/project'
      return {
        base: BASE_PATH,
        api: {
          db: path.join(global.__dirname, 'fixtures'), // this folder
        },
      }
    },
  }
})

import * as index from '../index'

test('getSchema returns a parsed schema.prisma', async () => {
  let schema = await index.getSchema('Post')
  expect(schema.fields[0].name).toEqual('id')
  expect(schema.fields[1].name).toEqual('title')
  expect(schema.fields[2].name).toEqual('slug')

  // can get a different model
  schema = await index.getSchema('User')
  expect(schema.fields[0].name).toEqual('id')
  expect(schema.fields[1].name).toEqual('name')
  expect(schema.fields[2].name).toEqual('email')
})

test('getSchema throws an error if model name not found', async () => {
  let error

  try {
    await index.getSchema('Foo')
  } catch (e) {
    error = e
  }

  expect(error).toEqual(new Error(error.message))
})

test('nameVariants returns a single word cased variables', () => {
  const names = ['Home', 'home']

  names.forEach((name) => {
    const vars = index.nameVariants(name)

    expect(vars.pascalName).toEqual('Home')
    expect(vars.camelName).toEqual('home')
    expect(vars.singularPascalName).toEqual('Home')
    expect(vars.pluralPascalName).toEqual('Homes')
    expect(vars.singularCamelName).toEqual('home')
    expect(vars.pluralCamelName).toEqual('homes')
    expect(vars.singularParamName).toEqual('home')
    expect(vars.pluralParamName).toEqual('homes')
  })
})

test('nameVariants returns a multi word cased variables', () => {
  const names = ['FooBar', 'fooBar', 'foo_bar', 'foo-bar']

  names.forEach((name) => {
    const vars = index.nameVariants(name)

    expect(vars.pascalName).toEqual('FooBar')
    expect(vars.camelName).toEqual('fooBar')
    expect(vars.singularPascalName).toEqual('FooBar')
    expect(vars.pluralPascalName).toEqual('FooBars')
    expect(vars.singularCamelName).toEqual('fooBar')
    expect(vars.pluralCamelName).toEqual('fooBars')
    expect(vars.singularParamName).toEqual('foo-bar')
    expect(vars.pluralParamName).toEqual('foo-bars')
  })
})
