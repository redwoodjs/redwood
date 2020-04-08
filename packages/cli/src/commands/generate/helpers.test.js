global.__dirname = __dirname
import {} from 'src/lib/test'

import * as helpers from './helpers'

const TEMPLATE_OUTPUT = `const FooBarPage = () => {
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
      '/path/to/project/web/src/pages/FooBarPage/FooBarPage.js'
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
    '/path/to/project/web/src/pages/HomePage/HomePage.js'
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
    '/path/to/project/api/src/services/HomePage/HomePage.js'
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
    '/path/to/project/web/src/pages/Hobbiton/Hobbiton.js'
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
    '/path/to/project/web/src/pages/HomePage/HomePage.txt'
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

  expect(output[1]).toEqual(TEMPLATE_OUTPUT)
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
