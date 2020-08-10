global.__dirname = __dirname
import path from 'path'

import { loadGeneratorFixture } from 'src/lib/test'
import { getDefaultArgs } from 'src/lib'

import { yargsDefaults as defaults } from '../../../generate'
import * as scaffold from '../scaffold'

describe('in javascript (default) mode', () => {
  let files

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'Post',
    })
  })

  test('returns exactly 16 files', () => {
    expect(Object.keys(files).length).toEqual(16)
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
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('assets', 'scaffold.css'))
    )
  })

  // Layout

  test('creates a layout', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/layouts/PostsLayout/PostsLayout.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('layouts', 'layout.js'))
    )
  })

  // Pages

  test('creates a edit page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/EditPostPage/EditPostPage.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'editPage.js'))
    )
  })

  test('creates a index page', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/pages/PostsPage/PostsPage.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'indexPage.js'))
    )
  })

  test('creates a new page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/NewPostPage/NewPostPage.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'newPage.js'))
    )
  })

  test('creates a show page', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'showPage.js'))
    )
  })

  // Cells

  test('creates an edit cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/EditPostCell/EditPostCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'editCell.js'))
    )
  })

  test('creates an index cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostsCell/PostsCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'indexCell.js'))
    )
  })

  test('creates a show cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostCell/PostCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'showCell.js'))
    )
  })

  // Components

  test('creates a form component', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostForm/PostForm.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'form.js'))
    )
  })

  test('creates an index component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Posts/Posts.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'index.js'))
    )
  })

  test('creates a new component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/NewPost/NewPost.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'new.js'))
    )
  })

  test('creates a show component', async () => {
    expect(
      files[path.normalize('/path/to/project/web/src/components/Post/Post.js')]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'show.js'))
    )
  })

  // Routes

  test('creates a single-word name routes', async () => {
    expect(await scaffold.routes({ model: 'Post' })).toEqual([
      '<Route path="/posts/new" page={NewPostPage} name="newPost" />',
      '<Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
      '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
      '<Route path="/posts" page={PostsPage} name="posts" />',
    ])
  })

  test('creates a multi-word name routes', async () => {
    expect(await scaffold.routes({ model: 'UserProfile' })).toEqual([
      '<Route path="/user-profiles/new" page={NewUserProfilePage} name="newUserProfile" />',
      '<Route path="/user-profiles/{id:Int}/edit" page={EditUserProfilePage} name="editUserProfile" />',
      '<Route path="/user-profiles/{id:Int}" page={UserProfilePage} name="userProfile" />',
      '<Route path="/user-profiles" page={UserProfilesPage} name="userProfiles" />',
    ])
  })

  // GraphQL queries

  test('the GraphQL in the index query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({ model: 'UserProfile' })
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
    const userProfileFiles = await scaffold.files({ model: 'UserProfile' })
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
    const userProfileFiles = await scaffold.files({ model: 'UserProfile' })
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
    const foreignKeyFiles = await scaffold.files({ model: 'UserProfile' })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/NewUserProfile/NewUserProfile.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture(
        'scaffold',
        path.join('components', 'foreignKeys', 'new.js')
      )
    )
  })

  test('creates an edit component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({ model: 'UserProfile' })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/EditUserProfileCell/EditUserProfileCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture(
        'scaffold',
        path.join('components', 'foreignKeys', 'edit.js')
      )
    )
  })
})

describe('in typescript mode', () => {
  let files

  beforeAll(async () => {
    files = await scaffold.files({
      ...getDefaultArgs(defaults),
      model: 'Post',
      typescript: true,
    })
  })

  test('returns exactly 16 files', () => {
    expect(Object.keys(files).length).toEqual(16)
  })

  // SDL

  test('creates an sdl', () => {
    expect(files).toHaveProperty([
      path.normalize('/path/to/project/api/src/graphql/posts.sdl.ts'),
    ])
  })

  // Service

  test('creates a service', () => {
    expect(files).toHaveProperty([
      path.normalize('/path/to/project/api/src/services/posts/posts.ts'),
    ])
  })

  test('creates a service test', () => {
    expect(files).toHaveProperty([
      path.normalize('/path/to/project/api/src/services/posts/posts.test.ts'),
    ])
  })

  // styles

  test('creates a stylesheet', () => {
    expect(
      files[path.normalize('/path/to/project/web/src/scaffold.css')]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('assets', 'scaffold.css'))
    )
  })

  // Layout

  test('creates a layout', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/layouts/PostsLayout/PostsLayout.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('layouts', 'layout.js'))
    )
  })

  // Pages

  test('creates a edit page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/EditPostPage/EditPostPage.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'editPage.js'))
    )
  })

  test('creates a index page', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/pages/PostsPage/PostsPage.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'indexPage.js'))
    )
  })

  test('creates a new page', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/pages/NewPostPage/NewPostPage.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'newPage.js'))
    )
  })

  test('creates a show page', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/pages/PostPage/PostPage.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('pages', 'showPage.js'))
    )
  })

  // Cells

  test('creates an edit cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/EditPostCell/EditPostCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'editCell.js'))
    )
  })

  test('creates an index cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostsCell/PostsCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'indexCell.js'))
    )
  })

  test('creates a show cell', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostCell/PostCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'showCell.js'))
    )
  })

  // Components

  test('creates a form component', async () => {
    expect(
      files[
        path.normalize(
          '/path/to/project/web/src/components/PostForm/PostForm.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'form.js'))
    )
  })

  test('creates an index component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/Posts/Posts.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'index.js'))
    )
  })

  test('creates a new component', async () => {
    expect(
      files[
        path.normalize('/path/to/project/web/src/components/NewPost/NewPost.js')
      ]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'new.js'))
    )
  })

  test('creates a show component', async () => {
    expect(
      files[path.normalize('/path/to/project/web/src/components/Post/Post.js')]
    ).toEqual(
      loadGeneratorFixture('scaffold', path.join('components', 'show.js'))
    )
  })

  // Routes

  test('creates a single-word name routes', async () => {
    expect(await scaffold.routes({ model: 'Post' })).toEqual([
      '<Route path="/posts/new" page={NewPostPage} name="newPost" />',
      '<Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
      '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
      '<Route path="/posts" page={PostsPage} name="posts" />',
    ])
  })

  test('creates a multi-word name routes', async () => {
    expect(await scaffold.routes({ model: 'UserProfile' })).toEqual([
      '<Route path="/user-profiles/new" page={NewUserProfilePage} name="newUserProfile" />',
      '<Route path="/user-profiles/{id:Int}/edit" page={EditUserProfilePage} name="editUserProfile" />',
      '<Route path="/user-profiles/{id:Int}" page={UserProfilePage} name="userProfile" />',
      '<Route path="/user-profiles" page={UserProfilesPage} name="userProfiles" />',
    ])
  })

  // GraphQL queries

  test('the GraphQL in the index query does not contain object types', async () => {
    const userProfileFiles = await scaffold.files({ model: 'UserProfile' })
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
    const userProfileFiles = await scaffold.files({ model: 'UserProfile' })
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
    const userProfileFiles = await scaffold.files({ model: 'UserProfile' })
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
    const foreignKeyFiles = await scaffold.files({ model: 'UserProfile' })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/NewUserProfile/NewUserProfile.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture(
        'scaffold',
        path.join('components', 'foreignKeys', 'new.js')
      )
    )
  })

  test('creates an edit component with int foreign keys converted in onSave', async () => {
    const foreignKeyFiles = await scaffold.files({ model: 'UserProfile' })

    expect(
      foreignKeyFiles[
        path.normalize(
          '/path/to/project/web/src/components/EditUserProfileCell/EditUserProfileCell.js'
        )
      ]
    ).toEqual(
      loadGeneratorFixture(
        'scaffold',
        path.join('components', 'foreignKeys', 'edit.js')
      )
    )
  })
})
