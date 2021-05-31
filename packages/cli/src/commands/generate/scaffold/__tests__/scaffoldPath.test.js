global.__dirname = __dirname
import path from 'path'

import 'src/lib/test'

import * as scaffold from '../scaffold'

let filesLower, filesUpper

beforeAll(async () => {
  filesLower = await scaffold.files({
    model: 'post',
    path: 'admin',
    tests: true,
    nestScaffoldByModel: true,
  })
  filesUpper = await scaffold.files({
    model: 'Post',
    path: 'Admin',
    tests: true,
    nestScaffoldByModel: true,
  })
})

describe('admin/post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesLower).length).toEqual(17)
    })

    // Layout
    test('creates a layout', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/Admin/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/Admin/Post/PostEditCell/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/Admin/Post/PostsCell/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(
        `import PostNew from 'src/components/Post/Admin/Post/PostNew/PostNew'`
      )
    })

    test('creates a show page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/Admin/Post/PostCell/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostEditCell/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostEditCell/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/Admin/Post/PostForm/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/Admin/Post/Posts/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/Admin/Post/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostNew/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostNew/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/Admin/Post/PostForm/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/Post/Post.js'
        ),
      ])
    })
  })
  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(await scaffold.routes({ model: 'post', path: 'admin' })).toEqual([
        '<Route path="/admin/posts/new" page={AdminPostNewPostPage} name="adminNewPost" />',
        '<Route path="/admin/posts/{id:Int}/edit" page={AdminPostEditPostPage} name="adminEditPost" />',
        '<Route path="/admin/posts/{id:Int}" page={AdminPostPostPage} name="adminPost" />',
        '<Route path="/admin/posts" page={AdminPostPostsPage} name="adminPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'userProfile', path: 'admin' })
      ).toEqual([
        '<Route path="/admin/user-profiles/new" page={AdminUserProfileNewPage} name="adminUserProfileNew" />',
        '<Route path="/admin/user-profiles/{id:Int}/edit" page={AdminUserProfileEditPage} name="adminUserProfileEdit" />',
        '<Route path="/admin/user-profiles/{id:Int}" page={AdminUserProfilePage} name="adminUserProfile" />',
        '<Route path="/admin/user-profiles" page={AdminUserProfilesPage} name="adminUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfilesCell/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfileCell/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfileEditCell/UserProfileEditCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })
  })

  describe('Foreign key casting', () => {
    test('creates a new component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/UserProfileNew/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/UserProfileEditCell/UserProfileEditCell.js'
        ),
      ])
    })
  })
})

describe('Admin/Post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesUpper).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/Admin/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/Admin/PostEditCell/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/Admin/PostsCell/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/Admin/PostNew/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/PostPage/PostPage.js'
          )
        ]
      ).toMatch(`import PostCell from 'src/components/Admin/PostCell/PostCell'`)
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/PostEditCell/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/PostEditCell/PostEditCell.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/PostForm/PostForm'`)
    })

    test('creates an index cell', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/Admin/Posts/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/Admin/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/PostNew/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/PostNew/PostNew.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/PostForm/PostForm'`)
    })

    test('creates a show component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(await scaffold.routes({ model: 'Post', path: 'Admin' })).toEqual([
        '<Route path="/admin/posts/new" page={AdminPostNewPage} name="adminPostNew" />',
        '<Route path="/admin/posts/{id:Int}/edit" page={AdminPostEditPage} name="adminPostEdit" />',
        '<Route path="/admin/posts/{id:Int}" page={AdminPostPage} name="adminPost" />',
        '<Route path="/admin/posts" page={AdminPostsPage} name="adminPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'UserProfile', path: 'Admin' })
      ).toEqual([
        '<Route path="/admin/user-profiles/new" page={AdminUserProfileNewPage} name="adminUserProfileNew" />',
        '<Route path="/admin/user-profiles/{id:Int}/edit" page={AdminUserProfileEditPage} name="adminUserProfileEdit" />',
        '<Route path="/admin/user-profiles/{id:Int}" page={AdminUserProfilePage} name="adminUserProfile" />',
        '<Route path="/admin/user-profiles" page={AdminUserProfilesPage} name="adminUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfilesCell/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfileCell/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfileEditCell/UserProfileEditCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })
  })

  describe('Foreign key casting', () => {
    test('creates a new component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/UserProfileNew/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/UserProfileEditCell/UserProfileEditCell.js'
        ),
      ])
    })
  })
})
