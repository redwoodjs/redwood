global.__dirname = __dirname
import path from 'path'

import 'src/lib/test'

import * as scaffold from '../scaffold'

let filesNestedLower, filesNestedUpper

beforeAll(async () => {
  filesNestedLower = await scaffold.files({
    model: 'post',
    path: 'admin/pages',
    tests: true,
    oneComponentFolder: true,
  })
  filesNestedUpper = await scaffold.files({
    model: 'Post',
    path: 'Admin/Pages',
    tests: true,
    oneComponentFolder: true,
  })
})

describe('admin/pages/post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesNestedLower).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/Admin/Pages/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/Admin/Pages/Post/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/Admin/Pages/Post/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/Admin/Pages/Post/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/Admin/Pages/Post/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/Admin/Pages/Post/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/Admin/Pages/Post/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/Admin/Pages/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesNestedLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/Admin/Pages/Post/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'post', path: 'admin/pages' })
      ).toEqual([
        '<Route path="/admin/pages/posts/new" page={AdminPagesPostNewPage} name="adminPagesPostNew" />',
        '<Route path="/admin/pages/posts/{id:Int}/edit" page={AdminPagesPostEditPage} name="adminPagesPostEdit" />',
        '<Route path="/admin/pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin/pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'userProfile', path: 'admin/pages' })
      ).toEqual([
        '<Route path="/admin/pages/user-profiles/new" page={AdminPagesUserProfileNewPage} name="adminPagesUserProfileNew" />',
        '<Route path="/admin/pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditPage} name="adminPagesUserProfileEdit" />',
        '<Route path="/admin/pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin/pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin/pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin/pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin/pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileEditCell.js'
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
        path: 'admin/pages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin/pages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})

describe('Admin/Pages/Post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesNestedUpper).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesNestedLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/Admin/Pages/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/Admin/Pages/Post/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/Admin/Pages/Post/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/Admin/Pages/Post/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Pages/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Pages/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/Admin/Pages/Post/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/Admin/Pages/Post/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/Admin/Pages/Post/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/Admin/Pages/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesNestedUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/Post/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/Admin/Pages/Post/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesNestedUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'Post', path: 'Admin/Pages' })
      ).toEqual([
        '<Route path="/admin/pages/posts/new" page={AdminPagesPostNewPage} name="adminPagesPostNew" />',
        '<Route path="/admin/pages/posts/{id:Int}/edit" page={AdminPagesPostEditPage} name="adminPagesPostEdit" />',
        '<Route path="/admin/pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin/pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'UserProfile', path: 'Admin/Pages' })
      ).toEqual([
        '<Route path="/admin/pages/user-profiles/new" page={AdminPagesUserProfileNewPage} name="adminPagesUserProfileNew" />',
        '<Route path="/admin/pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditPage} name="adminPagesUserProfileEdit" />',
        '<Route path="/admin/pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin/pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin/Pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin/Pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin/Pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileEditCell.js'
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
        path: 'Admin/Pages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'Admin/Pages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Pages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})
