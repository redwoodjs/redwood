import path from 'path'

import { getRoutes, getDuplicateRoutes } from '../routes'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const FIXTURE_WITH_ERRORS_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main-with-errors'
)

describe('Routes within the example todo', () => {
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  it('Detects all routes', () => {
    expect(getRoutes()).toStrictEqual([
      { name: 'home', page: 'HomePage', path: '/' },
      {
        name: 'typescriptPage',
        page: 'TypeScriptPage',
        path: '/typescript',
      },
      {
        name: 'someOtherPage',
        page: 'EditUserPage',
        path: '/somewhereElse',
      },
      { name: 'fooPage', page: 'FooPage', path: '/foo' },
      { name: 'barPage', page: 'BarPage', path: '/bar' },
      {
        name: 'privatePage',
        page: 'PrivatePage',
        path: '/private-page',
      },
      {
        name: undefined,
        page: 'NotFoundPage',
        path: undefined,
      },
    ])
  })
})

describe('Routes within the example todo with errors', () => {
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_WITH_ERRORS_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  it('Detects all routes', () => {
    expect(getRoutes()).toStrictEqual([
      { name: 'home', page: 'HomePage', path: '/' },
      { name: 'home', page: 'HomePage', path: '/' },
      {
        name: 'something-else',
        page: 'DoesNotExist',
        path: '/{foo}/{foo}',
      },
      {
        name: undefined,
        page: 'NotFoundPage',
        path: undefined,
      },
    ])
  })

  it('Detects duplicate root routes', () => {
    expect(getDuplicateRoutes()).toStrictEqual([
      { name: 'home', page: 'HomePage', path: '/' },
      { name: 'home', page: 'HomePage', path: '/' },
    ])
  })
})
