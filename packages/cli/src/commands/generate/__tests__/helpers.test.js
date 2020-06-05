import path from 'path'

global.__dirname = __dirname
import {} from 'src/lib/test'

import * as helpers from '../helpers'

const PAGE_TEMPLATE_OUTPUT = `const FooBarPage = () => {
  return (
    <div>
      <h1>FooBarPage</h1>
      <p>Find me in ./web/src/pages/FooBarPage/FooBarPage.js</p>
    </div>
  )
}

export default FooBarPage
`

test('templateForComponentFile creates a proper output path for files', () => {
  const names = ['FooBar', 'fooBar', 'foo-bar', 'foo_bar', 'FOO_BAR']

  names.forEach((name) => {
    const output = helpers.templateForComponentFile({
      name: name,
      suffix: 'Page',
      webPathSection: 'pages',
      generator: 'page',
      templatePath: 'page.js.template',
    })

    expect(output[0]).toEqual(
      path.normalize('/path/to/project/web/src/pages/FooBarPage/FooBarPage.js')
    )
  })
})

test('templateForComponentFile can create a path in /web', () => {
  const output = helpers.templateForComponentFile({
    name: 'Home',
    suffix: 'Page',
    webPathSection: 'pages',
    generator: 'page',
    templatePath: 'page.js.template',
  })

  expect(output[0]).toEqual(
    path.normalize('/path/to/project/web/src/pages/HomePage/HomePage.js')
  )
})

test('templateForComponentFile can create a path in /api', () => {
  const output = helpers.templateForComponentFile({
    name: 'Home',
    suffix: 'Page',
    apiPathSection: 'services',
    generator: 'page',
    templatePath: 'page.js.template',
  })

  expect(output[0]).toEqual(
    path.normalize('/path/to/project/api/src/services/HomePage/HomePage.js')
  )
})

test('templateForComponentFile can override generated component name', () => {
  const output = helpers.templateForComponentFile({
    name: 'Home',
    componentName: 'Hobbiton',
    webPathSection: 'pages',
    generator: 'page',
    templatePath: 'page.js.template',
  })

  expect(output[0]).toEqual(
    path.normalize('/path/to/project/web/src/pages/Hobbiton/Hobbiton.js')
  )
})

test('templateForComponentFile can override file extension', () => {
  const output = helpers.templateForComponentFile({
    name: 'Home',
    suffix: 'Page',
    extension: '.txt',
    webPathSection: 'pages',
    generator: 'page',
    templatePath: 'page.js.template',
  })

  expect(output[0]).toEqual(
    path.normalize('/path/to/project/web/src/pages/HomePage/HomePage.txt')
  )
})

test('templateForComponentFile can override output path', () => {
  const output = helpers.templateForComponentFile({
    name: 'func',
    apiPathSection: 'functions',
    generator: 'function',
    templatePath: 'function.js.template',
    templateVars: { name: 'func' },
    outputPath: path.normalize('/path/to/project/api/src/functions/func.js'),
  })

  expect(output[0]).toEqual(
    path.normalize('/path/to/project/api/src/functions/func.js')
  )
})

test('templateForComponentFile creates a template', () => {
  const output = helpers.templateForComponentFile({
    name: 'FooBar',
    suffix: 'Page',
    webPathSection: 'pages',
    generator: 'page',
    templatePath: 'page.js.template',
  })

  expect(output[1]).toEqual(PAGE_TEMPLATE_OUTPUT)
})

test('pathName uses passed path if present', () => {
  const paths = ['FooBar', 'fooBar', 'foo-bar', 'foo_bar', 'foobar', '/foobar']

  paths.forEach((path) => {
    expect(helpers.pathName(path, 'FooBar')).toEqual(path)
  })
})

test('pathName creates path based on name if path is null', () => {
  const names = ['FooBar', 'fooBar', 'foo-bar', 'foo_bar', 'FOO_BAR']

  names.forEach((name) => {
    expect(helpers.pathName(null, name)).toEqual('/foo-bar')
  })
})

test('relationsForModel returns related field names from a belongs-to relationship', () => {
  const model = {
    name: 'UserProfile',
    isEmbedded: false,
    dbName: null,
    fields: [
      {
        name: 'id',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        type: 'Int',
        default: [Object],
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'userId',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        type: 'Int',
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'user',
        kind: 'object',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        type: 'User',
        relationName: 'UserToUserProfile',
        relationToFields: [Array],
        relationOnDelete: 'NONE',
        isGenerated: false,
        isUpdatedAt: false,
      },
    ],
    isGenerated: false,
    idFields: [],
    uniqueFields: [],
  }

  expect(helpers.relationsForModel(model)).toEqual(['user'])
})

test('relationsForModel returns related field names from a has-many relationship', () => {
  const model = {
    name: 'User',
    isEmbedded: false,
    dbName: null,
    fields: [
      {
        name: 'id',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        type: 'Int',
        default: [Object],
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'name',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: false,
        isUnique: false,
        isId: false,
        type: 'String',
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'profiles',
        kind: 'object',
        dbNames: [],
        isList: true,
        isRequired: false,
        isUnique: false,
        isId: false,
        type: 'UserProfile',
        relationName: 'UserToUserProfile',
        relationToFields: [],
        relationOnDelete: 'NONE',
        isGenerated: false,
        isUpdatedAt: false,
      },
    ],
    isGenerated: false,
    idFields: [],
    uniqueFields: [],
  }

  expect(helpers.relationsForModel(model)).toEqual(['userProfiles'])
})

test('intForeignKeysForModel returns names of foreign keys that are Int datatypes', () => {
  const model = {
    name: 'UserProfile',
    isEmbedded: false,
    dbName: null,
    fields: [
      {
        name: 'id',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        type: 'Int',
        default: [Object],
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'userId',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        type: 'Int',
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'user',
        kind: 'object',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        type: 'User',
        relationName: 'UserToUserProfile',
        relationToFields: [Array],
        relationOnDelete: 'NONE',
        isGenerated: false,
        isUpdatedAt: false,
      },
    ],
    isGenerated: false,
    idFields: [],
    uniqueFields: [],
  }

  expect(helpers.intForeignKeysForModel(model)).toEqual(['userId'])
})

test('intForeignKeysForModel does not include foreign keys of other datatypes', () => {
  const model = {
    name: 'UserProfile',
    isEmbedded: false,
    dbName: null,
    fields: [
      {
        name: 'id',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: true,
        type: 'Int',
        default: [Object],
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'userId',
        kind: 'scalar',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        type: 'String',
        isGenerated: false,
        isUpdatedAt: false,
      },
      {
        name: 'user',
        kind: 'object',
        dbNames: [],
        isList: false,
        isRequired: true,
        isUnique: false,
        isId: false,
        type: 'User',
        relationName: 'UserToUserProfile',
        relationToFields: [Array],
        relationOnDelete: 'NONE',
        isGenerated: false,
        isUpdatedAt: false,
      },
    ],
    isGenerated: false,
    idFields: [],
    uniqueFields: [],
  }

  expect(helpers.intForeignKeysForModel(model)).toEqual([])
})
