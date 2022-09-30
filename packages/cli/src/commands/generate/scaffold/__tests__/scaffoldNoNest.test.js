global.__dirname = __dirname
import path from 'path'

// Load mocks
import '../../../../lib/test'

import { getDefaultArgs } from '../../../../lib'
import { yargsDefaults as defaults } from '../../../generate'
import * as scaffold from '../scaffold'

jest.mock('execa')

describe('in javascript (default) mode', () => {
  let files

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'Post',
      tests: true,
      nestScaffoldByModel: false,
    })
  })

  test('returns exactly 19 files', () => {
    expect(Object.keys(files).length).toEqual(19)
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
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.js'
        )
      ]
    ).toMatchSnapshot()
  })

  // Pages

  test('creates a edit page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/EditPostPage/EditPostPage.js'
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
          '/path/to/project/web/src/pages/NewPostPage/NewPostPage.js'
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
          '/path/to/project/web/src/components/PostEditCell/PostEditCell.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an index cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostsCell/PostsCell.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a show cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostCell/PostCell.js'
        )
      ]
    ).toMatchSnapshot()
  })

  // Components

  test('creates a form component', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostForm/PostForm.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an index component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Posts/Posts.js')
      ]
    ).toMatchSnapshot()
  })

  test('creates a new component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/PostNew/PostNew.js')
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
    expect(
      await scaffold.routes({ model: 'Post', nestScaffoldByModel: false })
    ).toEqual([
      '<Route path="/posts/new" page={NewPostPage} name="newPost" />',
      '<Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
      '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
      '<Route path="/posts" page={PostsPage} name="posts" />',
    ])
  })

  test('creates a multi-word name routes', async () => {
    expect(
      await scaffold.routes({
        model: 'UserProfile',
        nestScaffoldByModel: false,
      })
    ).toEqual([
      '<Route path="/user-profiles/new" page={NewUserProfilePage} name="newUserProfile" />',
      '<Route path="/user-profiles/{id:Int}/edit" page={EditUserProfilePage} name="editUserProfile" />',
      '<Route path="/user-profiles/{id:Int}" page={UserProfilePage} name="userProfile" />',
      '<Route path="/user-profiles" page={UserProfilesPage} name="userProfiles" />',
    ])
  })

  // GraphQL queries

  test('the GraphQL in the index query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      nestScaffoldByModel: false,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfilesCell/UserProfilesCell.js'
        )
      ]
    const query = cell.match(/(userProfiles.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the show query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      nestScaffoldByModel: false,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the edit query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      nestScaffoldByModel: false,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/EditUserProfileCell/EditUserProfileCell.js'
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
      nestScaffoldByModel: false,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/NewUserProfile/NewUserProfile.js'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an edit component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      nestScaffoldByModel: false,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/EditUserProfileCell/EditUserProfileCell.js'
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
      nestScaffoldByModel: false,
    })
  })

  test('returns exactly 19 files', () => {
    expect(Object.keys(tsFiles).length).toEqual(19)
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
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  // Pages

  test('creates a edit page', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/pages/EditPostPage/EditPostPage.tsx'
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
          '/path/to/project/web/src/pages/NewPostPage/NewPostPage.tsx'
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
          '/path/to/project/web/src/components/EditPostCell/EditPostCell.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an index cell', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/components/PostsCell/PostsCell.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates a show cell', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/components/PostCell/PostCell.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  // Components

  test('creates a form component', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/components/PostForm/PostForm.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an index component', async () => {
    expect(
      tsFiles[
        path.normalize('/path/to/project/web/src/components/Posts/Posts.tsx')
      ]
    ).toMatchSnapshot()
  })

  test('creates a new component', async () => {
    expect(
      tsFiles[
        path.normalize(
          '/path/to/project/web/src/components/PostNew/PostNew.tsx'
        )
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
    expect(
      await scaffold.routes({ model: 'Post', nestScaffoldByModel: false })
    ).toEqual([
      '<Route path="/posts/new" page={NewPostPage} name="newPost" />',
      '<Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
      '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
      '<Route path="/posts" page={PostsPage} name="posts" />',
    ])
  })

  test('creates a multi-word name routes', async () => {
    expect(
      await scaffold.routes({
        model: 'UserProfile',
        nestScaffoldByModel: false,
      })
    ).toEqual([
      '<Route path="/user-profiles/new" page={NewUserProfilePage} name="newUserProfile" />',
      '<Route path="/user-profiles/{id:Int}/edit" page={EditUserProfilePage} name="editUserProfile" />',
      '<Route path="/user-profiles/{id:Int}" page={UserProfilePage} name="userProfile" />',
      '<Route path="/user-profiles" page={UserProfilesPage} name="userProfiles" />',
    ])
  })

  // GraphQL queries

  test('the GraphQL in the index query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      nestScaffoldByModel: false,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfilesCell/UserProfilesCell.js'
        )
      ]
    const query = cell.match(/(userProfiles.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the show query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      tests: false,
      nestScaffoldByModel: false,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/UserProfileCell/UserProfileCell.js'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  test('the GraphQL in the edit query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({
      model: 'UserProfile',
      typescript: true,
      tests: false,
      nestScaffoldByModel: false,
    })
    const cell =
      userProfileFiles[
        path.normalize(
          '/path/to/project/web/src/components/EditUserProfileCell/EditUserProfileCell.tsx'
        )
      ]
    const query = cell.match(/(userProfile.*?\})/s)[1]

    expect(query).not.toMatch(/^\s+user$/m)
  })

  // Foreign key casting

  test('creates a new component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      typescript: true,
      tests: false,
      nestScaffoldByModel: false,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/NewUserProfile/NewUserProfile.tsx'
        )
      ]
    ).toMatchSnapshot()
  })

  test('creates an edit component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({
      model: 'UserProfile',
      typescript: true,
      tests: false,
      nestScaffoldByModel: false,
    })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/EditUserProfileCell/EditUserProfileCell.tsx'
        )
      ]
    ).toMatchSnapshot()
  })
})
