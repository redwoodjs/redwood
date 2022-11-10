import path from 'path'

import { getRoutes, getDuplicateRoutes } from '../routes'

const FIXTURE_PATH_EMPTY_PROJECT = path.resolve(
  __dirname,
  '../../../../__fixtures__/empty-project'
)

const FIXTURE_PATH_EXAMPLE = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

const FIXTURE_PATH_EXAMPLE_WITH_ERRORS = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main-with-errors'
)

const FIXTURE_PATH_TEST_PROJECT = path.resolve(
  __dirname,
  '../../../../__fixtures__/test-project'
)

describe('Routes within the empty project', () => {
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH_EMPTY_PROJECT
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  it('Detects all routes', () => {
    expect(getRoutes()).toStrictEqual([
      {
        name: undefined,
        page: 'NotFoundPage',
        path: undefined,
      },
    ])
  })

  it('Detects no duplicate routes', () => {
    expect(getDuplicateRoutes()).toStrictEqual([])
  })
})

describe('Routes within the example todo project', () => {
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH_EXAMPLE
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

  it('Detects no duplicate routes', () => {
    expect(getDuplicateRoutes()).toStrictEqual([])
  })
})

describe('Routes within the example todo with errors project', () => {
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH_EXAMPLE_WITH_ERRORS
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

describe('Routes within the test project', () => {
  beforeEach(() => {
    process.env.RWJS_CWD = FIXTURE_PATH_TEST_PROJECT
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })

  it('Detects all routes', () => {
    expect(getRoutes()).toStrictEqual([
      { name: 'login', page: 'LoginPage', path: '/login' },
      { name: 'signup', page: 'SignupPage', path: '/signup' },
      {
        name: 'forgotPassword',
        page: 'ForgotPasswordPage',
        path: '/forgot-password',
      },
      {
        name: 'resetPassword',
        page: 'ResetPasswordPage',
        path: '/reset-password',
      },
      {
        name: 'newContact',
        page: 'ContactNewContactPage',
        path: '/contacts/new',
      },
      {
        name: 'editContact',
        page: 'ContactEditContactPage',
        path: '/contacts/{id:Int}/edit',
      },
      {
        name: 'contact',
        page: 'ContactContactPage',
        path: '/contacts/{id:Int}',
      },
      { name: 'contacts', page: 'ContactContactsPage', path: '/contacts' },
      { name: 'newPost', page: 'PostNewPostPage', path: '/posts/new' },
      {
        name: 'editPost',
        page: 'PostEditPostPage',
        path: '/posts/{id:Int}/edit',
      },
      { name: 'post', page: 'PostPostPage', path: '/posts/{id:Int}' },
      { name: 'posts', page: 'PostPostsPage', path: '/posts' },
      { name: 'waterfall', page: 'WaterfallPage', path: '/waterfall/{id:Int}' },
      { name: 'profile', page: 'ProfilePage', path: '/profile' },
      { name: 'blogPost', page: 'BlogPostPage', path: '/blog-post/{id:Int}' },
      { name: 'contact', page: 'ContactPage', path: '/contact' },
      { name: 'about', page: 'AboutPage', path: '/about' },
      { name: 'home', page: 'HomePage', path: '/' },
      {
        name: undefined,
        page: 'NotFoundPage',
        path: undefined,
      },
    ])
  })

  it('Detects no duplicate routes', () => {
    expect(getDuplicateRoutes()).toStrictEqual([])
  })
})
