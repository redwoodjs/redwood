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

import path from 'path'

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
    expect(vars.singularConstantName).toEqual('HOME')
    expect(vars.pluralConstantName).toEqual('HOMES')
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

test('generateTemplate returns a lodash-templated string', () => {
  const output = index.generateTemplate(
    path.join(__dirname, 'fixtures', 'text.txt'),
    {
      name: 'amet',
      noun: 'world',
    }
  )

  expect(output).toEqual(`Lorem ipsum dolar sit amet\nHello, world!\n`)
})

// Be careful when editing the code.js fixture as the prettifier.config.js will cause it to get
// prettified and then it already match the expected output, with no changes
test('generateTemplate returns prettified JS code', () => {
  const output = index.generateTemplate(
    path.join(__dirname, 'fixtures', 'code.js'),
    {
      name: 'fox',
      foo: 'dog',
    }
  )

  expect(output).toEqual(
    `const line1 = 'The quick brown foxes jumps over the lazy dog.'\nconst line2 = 'Sphinx of black quartz, judge my vow.'\n`
  )
})
