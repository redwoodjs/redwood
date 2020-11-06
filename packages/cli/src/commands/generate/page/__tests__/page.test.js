global.__dirname = __dirname

global.mockFs = false
let mockFiles = {}

jest.mock('fs', () => {
  const actual = jest.requireActual('fs')

  return {
    ...actual,
    existsSync: (...args) => {
      if (!global.mockFs) {
        return actual.existsSync.apply(null, args)
      }
      return false
    },
    mkdirSync: (...args) => {
      if (!global.mockFs) {
        return actual.mkdirSync.apply(null, args)
      }
    },
    writeFileSync: (target, contents) => {
      if (!global.mockFs) {
        return actual.writeFileSync.call(null, target, contents)
      }
    },
    readFileSync: (path) => {
      if (!global.mockFs) {
        return actual.readFileSync.call(null, path)
      }

      const mockedContent = mockFiles[path]

      return mockedContent || actual.readFileSync.call(null, path)
    },
  }
})

import fs from 'fs'
import path from 'path'

import { getPaths } from 'src/lib'
import { loadGeneratorFixture } from 'src/lib/test'

import { pathName } from '../../helpers'
import * as page from '../page'

let singleWordFiles, multiWordFiles, pluralWordFiles, paramFiles

beforeAll(() => {
  singleWordFiles = page.files({
    name: 'Home',
    ...page.paramVariants(pathName(undefined, 'home')),
  })
  multiWordFiles = page.files({
    name: 'ContactUs',
    ...page.paramVariants(pathName(undefined, 'contact-us')),
  })
  pluralWordFiles = page.files({
    name: 'Cats',
    ...page.paramVariants(pathName(undefined, 'cats')),
  })
  paramFiles = page.files({
    name: 'Post',
    ...page.paramVariants(pathName('{id}', 'post')),
  })
})

test('returns exactly 3 files', () => {
  expect(Object.keys(singleWordFiles).length).toEqual(3)
})

test('creates a page component', () => {
  expect(
    singleWordFiles[
      path.normalize('/path/to/project/web/src/pages/HomePage/HomePage.js')
    ]
  ).toEqual(loadGeneratorFixture('page', 'singleWordPage.js'))
})

test('creates a page test', () => {
  expect(
    singleWordFiles[
      path.normalize('/path/to/project/web/src/pages/HomePage/HomePage.test.js')
    ]
  ).toEqual(loadGeneratorFixture('page', 'singleWordPage.test.js'))
})

test('creates a page story', () => {
  expect(
    singleWordFiles[
      path.normalize(
        '/path/to/project/web/src/pages/HomePage/HomePage.stories.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('page', 'singleWordPage.stories.js'))
})

test('creates a page component', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/pages/ContactUsPage/ContactUsPage.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('page', 'multiWordPage.js'))
})

test('creates a test for a component with multiple words for a name', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/pages/ContactUsPage/ContactUsPage.test.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('page', 'multiWordPage.test.js'))
})

test('creates a page story', () => {
  expect(
    multiWordFiles[
      path.normalize(
        '/path/to/project/web/src/pages/ContactUsPage/ContactUsPage.stories.js'
      )
    ]
  ).toEqual(loadGeneratorFixture('page', 'multiWordPage.stories.js'))
})

test('creates a page component with a plural word for name', () => {
  expect(
    pluralWordFiles[
      path.normalize('/path/to/project/web/src/pages/CatsPage/CatsPage.js')
    ]
  ).toEqual(loadGeneratorFixture('page', 'pluralWordPage.js'))
})

test('creates a page component with params', () => {
  expect(
    paramFiles[
      path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.js')
    ]
  ).toEqual(loadGeneratorFixture('page', 'paramPage.js'))
})

test('creates a test for page component with params', () => {
  expect(
    paramFiles[
      path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.test.js')
    ]
  ).toEqual(loadGeneratorFixture('page', 'paramPage.test.js'))
})

test('creates a single-word route name', () => {
  const names = ['Home', 'home']

  names.forEach((name) => {
    expect(page.routes({ name: name, path: '/' })).toEqual([
      '<Route path="/" page={HomePage} name="home" />',
    ])
  })
})

test('creates a camelCase route name for multiple word names', () => {
  const names = ['FooBar', 'foo_bar', 'foo-bar', 'fooBar']

  names.forEach((name) => {
    expect(page.routes({ name: name, path: 'foo-bar' })).toEqual([
      '<Route path="foo-bar" page={FooBarPage} name="fooBar" />',
    ])
  })
})

test('creates a path equal to passed path', () => {
  expect(page.routes({ name: 'FooBar', path: 'fooBar-baz' })).toEqual([
    '<Route path="fooBar-baz" page={FooBarPage} name="fooBar" />',
  ])
})

test('paramVariants returns empty string for no params', () => {
  expect(page.paramVariants()).toEqual({
    propParam: '',
    propValueParam: '',
    argumentParam: '',
    paramName: '',
    paramValue: '',
  })
  expect(page.paramVariants('')).toEqual({
    propParam: '',
    propValueParam: '',
    argumentParam: '',
    paramName: '',
    paramValue: '',
  })
  expect(page.paramVariants('/')).toEqual({
    propParam: '',
    propValueParam: '',
    argumentParam: '',
    paramName: '',
    paramValue: '',
  })
  expect(page.paramVariants('/post/edit')).toEqual({
    propParam: '',
    propValueParam: '',
    argumentParam: '',
    paramName: '',
    paramValue: '',
  })
})

test('paramVariants finds the param in the middle of the path', () => {
  expect(page.paramVariants('/post/{id:Int}/edit')).toEqual({
    propParam: '{ id }',
    propValueParam: 'id="42" ',
    argumentParam: "{ id: '42' }",
    paramName: 'id',
    paramValue: ' 42',
  })
})

test('file generation', async () => {
  mockFiles = {
    [getPaths().web.routes]: [
      "import { Router, Route } from '@redwoodjs/router'",
      '',
      'const Routes = () => {',
      '  return (',
      '    <Router>',
      '      <Route path="/about" page={AboutPage} name="about" />',
      '      <Route notfound page={NotFoundPage} />',
      '    </Router>',
      '  )',
      '}',
      '',
      'export default Routes',
    ].join('\n'),
  }

  const spy = jest.spyOn(fs, 'writeFileSync')
  global.mockFs = true

  await page.handler({ name: 'home', path: '', force: false })

  expect(spy).toHaveBeenCalledWith(
    path.normalize('/path/to/project/web/src/pages/HomePage/HomePage.js'),
    loadGeneratorFixture('page', 'singleWordPage.js')
  )

  expect(spy).toHaveBeenCalledWith(
    path.normalize('/path/to/project/web/src/pages/HomePage/HomePage.test.js'),
    loadGeneratorFixture('page', 'singleWordPage.test.js')
  )

  expect(spy).toHaveBeenCalledWith(
    path.normalize(
      '/path/to/project/web/src/pages/HomePage/HomePage.stories.js'
    ),
    loadGeneratorFixture('page', 'singleWordPage.stories.js')
  )

  expect(spy).toHaveBeenCalledWith(
    path.normalize('/path/to/project/web/src/Routes.js'),
    [
      "import { Router, Route } from '@redwoodjs/router'",
      '',
      'const Routes = () => {',
      '  return (',
      '    <Router>',
      '      <Route path="/home" page={HomePage} name="home" />',
      '      <Route path="/about" page={AboutPage} name="about" />',
      '      <Route notfound page={NotFoundPage} />',
      '    </Router>',
      '  )',
      '}',
      '',
      'export default Routes',
    ].join('\n')
  )

  global.mockFs = false
  spy.mockRestore()
})

test('file generation with route params', async () => {
  mockFiles = {
    [getPaths().web.routes]: [
      "import { Router, Route } from '@redwoodjs/router'",
      '',
      'const Routes = () => {',
      '  return (',
      '    <Router>',
      '      <Route path="/about" page={AboutPage} name="about" />',
      '      <Route notfound page={NotFoundPage} />',
      '    </Router>',
      '  )',
      '}',
      '',
      'export default Routes',
    ].join('\n'),
  }

  const spy = jest.spyOn(fs, 'writeFileSync')
  global.mockFs = true

  await page.handler({ name: 'post', path: '{id}', force: false })

  expect(spy).toHaveBeenCalledWith(
    path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.js'),
    loadGeneratorFixture('page', 'paramPage.js')
  )

  expect(spy).toHaveBeenCalledWith(
    path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.test.js'),
    loadGeneratorFixture('page', 'paramPage.test.js')
  )

  expect(spy).toHaveBeenCalledWith(
    path.normalize(
      '/path/to/project/web/src/pages/PostPage/PostPage.stories.js'
    ),
    loadGeneratorFixture('page', 'paramPage.stories.js')
  )

  expect(spy).toHaveBeenCalledWith(
    path.normalize('/path/to/project/web/src/Routes.js'),
    [
      "import { Router, Route } from '@redwoodjs/router'",
      '',
      'const Routes = () => {',
      '  return (',
      '    <Router>',
      '      <Route path="/post/{id}" page={PostPage} name="post" />',
      '      <Route path="/about" page={AboutPage} name="about" />',
      '      <Route notfound page={NotFoundPage} />',
      '    </Router>',
      '  )',
      '}',
      '',
      'export default Routes',
    ].join('\n')
  )

  global.mockFs = false
  spy.mockRestore()
})
