global.__dirname = __dirname
import path from 'path'

// Load mocks
import 'src/lib/test'

import { getDefaultArgs } from 'src/lib'

import { yargsDefaults as defaults } from '../../../generate'
import * as scaffold from '../scaffold'

describe('in javascript (default) mode', () => {
  let files

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'Post',
      tests: true,
      oneComponentFolder: true,
    })
  })

  test('returns exactly 17 files', () => {
    expect(Object.keys(files).length).toEqual(17)
  })
  // SDL

  test('creates an sdl', () => {
    expect(files).toHaveProperty([
      path.normalize('/path/to/project/api/src/graphql/posts.sdl.js'),
    ])
  })

  // Service

  test('creates a service', () => {
    expect(files).toHaveProperty([
      path.normalize('/path/to/project/api/src/services/posts/posts.js'),
    ])
  })

  test('creates a service test', () => {
    expect(files).toHaveProperty([
      path.normalize('/path/to/project/api/src/services/posts/posts.test.js'),
    ])
  })

  // styles

  test('creates a stylesheet', () => {
    expect(
      files[path.normalize('/path/to/project/web/src/scaffold.css')]
    ).toMatchSnapshot()
  })

  // Layout

  test('creates a layout', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/layouts/PostsLayout/PostsLayout.js'
        )
      ]
    ).toMatchSnapshot()
  })

  // Pages

  test('creates a edit page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/PostEditPage/PostEditPage.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a index page', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/pages/PostsPage/PostsPage.js')
      ]
    ).toMatchSnapshot()
  })

  test('creates a new page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/PostNewPage/PostNewPage.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a show page', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.js')
      ]
    ).toMatchSnapshot()
  })

  // Cells

  test('creates an edit cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/Post/PostEditCell.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an index cell', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Post/PostsCell.js')
      ]
    ).toMatchSnapshot()
  })

  test('creates a show cell', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Post/PostCell.js')
      ]
    ).toMatchSnapshot()
  })

  // Components

  test('creates a form component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Post/PostForm.js')
      ]
    ).toMatchSnapshot()
  })

  test('creates an index component', async () => {
    expect(
      files[path.normalize('/path/to/project/web/src/components/Post/Posts.js')]
    ).toMatchSnapshot()
  })

  test('creates a new component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Post/PostNew.js')
      ]
    ).toMatchSnapshot()
  })

  test('creates a show component', async () => {
    expect(
      files[path.normalize('/path/to/project/web/src/components/Post/Post.js')]
    ).toMatchSnapshot()
  })

  // Routes

  test('creates a single-word name routes', async () => {
    expect(await scaffold.routes({ model: 'Post' })).toEqual([
      '<Route path="/posts/new" page={PostNewPage} name="postNew" />',
      '<Route path="/posts/{id:Int}/edit" page={PostEditPage} name="postEdit" />',
      '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
      '<Route path="/posts" page={PostsPage} name="posts" />',
    ])
  })

  test('creates a multi-word name routes', async () => {
    expect(await scaffold.routes({ model: 'UserProfile' })).toEqual([
      '<Route path="/user-profiles/new" page={UserProfileNewPage} name="userProfileNew" />',
      '<Route path="/user-profiles/{id:Int}/edit" page={UserProfileEditPage} name="userProfileEdit" />',
      '<Route path="/user-profiles/{id:Int}" page={UserProfilePage} name="userProfile" />',
      '<Route path="/user-profiles" page={UserProfilesPage} name="userProfiles" />',
    ])
  })

  // GraphQL queries

  test('the GraphQL in the index query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfilesCell.js'
        )
      ]
    const query = cell.match(/(userProfiles.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the show query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileCell.js'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the edit query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileEditCell.js'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  // Foreign key casting

  test('creates a new component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfileNew/UserProfileNew.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an edit component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileEditCell.js'
        )
      ]
    ).toMatchSnapshot()
  })
})

describe('in typescript mode', () => {
  let tsFiles

  beforeAll(async () => {
    tsFiles = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'Post',
      typescript: true,
      tests: true,
      oneComponentFolder: true,
    })
  })

  test('returns exactly 17 files', () => {
    expect(Object.keys(tsFiles).length).toEqual(17)
  })

  // SDL

  test('creates an sdl', () => {
    expect(tsFiles).toHaveProperty([
      path.normalize('/path/to/project/api/src/graphql/posts.sdl.ts'),
    ])
  })

  // Service

  test('creates a service', () => {
    expect(tsFiles).toHaveProperty([
      path.normalize('/path/to/project/api/src/services/posts/posts.ts'),
    ])
  })

  test('creates a service test', () => {
    expect(tsFiles).toHaveProperty([
      path.normalize('/path/to/project/api/src/services/posts/posts.test.ts'),
    ])
  })

  // styles

  test('creates a stylesheet', () => {
    expect(
      tsFiles[path.normalize('/path/to/project/web/src/scaffold.css')]
    ).toMatchSnapshot()
  })

  // Layout

  test('creates a layout', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/layouts/PostsLayout/PostsLayout.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  // Pages

  test('creates a edit page', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/pages/PostEditPage/PostEditPage.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a index page', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/pages/PostsPage/PostsPage.tsx')
      ]
    ).toMatchSnapshot()
  })

  test('creates a new page', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/pages/PostNewPage/PostNewPage.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a show page', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.tsx')
      ]
    ).toMatchSnapshot()
  })

  // Cells

  test('creates an edit cell', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/components/Post/PostEditCell.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an index cell', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Post/PostsCell.tsx')
      ]
    ).toMatchSnapshot()
  })

  test('creates a show cell', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Post/PostCell.tsx')
      ]
    ).toMatchSnapshot()
  })

  // Components

  test('creates a form component', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Post/PostForm.tsx')
      ]
    ).toMatchSnapshot()
  })

  test('creates an index component', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Post/Posts.tsx')
      ]
    ).toMatchSnapshot()
  })

  test('creates a new component', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Post/PostNew.tsx')
      ]
    ).toMatchSnapshot()
  })

  test('creates a show component', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Post/Post.tsx')
      ]
    ).toMatchSnapshot()
  })

  // Routes

  test('creates a single-word name routes', async () => {
    expect(await scaffold.routes({ model: 'Post' })).toEqual([
      '<Route path="/posts/new" page={PostNewPage} name="postNew" />',
      '<Route path="/posts/{id:Int}/edit" page={PostEditPage} name="postEdit" />',
      '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
      '<Route path="/posts" page={PostsPage} name="posts" />',
    ])
  })

  test('creates a multi-word name routes', async () => {
    expect(await scaffold.routes({ model: 'UserProfile' })).toEqual([
      '<Route path="/user-profiles/new" page={UserProfileNewPage} name="userProfileNew" />',
      '<Route path="/user-profiles/{id:Int}/edit" page={UserProfileEditPage} name="userProfileEdit" />',
      '<Route path="/user-profiles/{id:Int}" page={UserProfilePage} name="userProfile" />',
      '<Route path="/user-profiles" page={UserProfilesPage} name="userProfiles" />',
    ])
  })

  // GraphQL queries

  test('the GraphQL in the index query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfilesCell.js'
        )
      ]
    const query = cell.match(/(userProfiles.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the show query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileCell.js'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the edit query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileEditCell.js'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  // Foreign key casting

  test('creates a new component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileNew.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an edit component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      oneComponentFolder: true,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfile/UserProfileEditCell.js'
        )
      ]
    ).toMatchSnapshot()
  })
})
