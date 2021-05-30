global.__dirname = __dirname
import path from 'path'

import 'src/lib/test'

import * as scaffold from '../scaffold'

let filesMultiwordLower,
  filesMultiwordUpper,
  filesMultiwordDash,
  filesMultiwordUnderscore

beforeAll(async () => {
  filesMultiwordLower = await scaffold.files({
    model: 'post',
    path: 'adminPages',
    tests: true,
    oneComponentFolder: true,
  })
  filesMultiwordUpper = await scaffold.files({
    model: 'Post',
    path: 'AdminPages',
    tests: true,
    oneComponentFolder: true,
  })
  filesMultiwordDash = await scaffold.files({
    model: 'post',
    path: 'admin-pages',
    tests: true,
    oneComponentFolder: true,
  })
  filesMultiwordUnderscore = await scaffold.files({
    model: 'post',
    path: 'admin_pages',
    tests: true,
    oneComponentFolder: true,
  })
})

describe('adminPages/post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesMultiwordLower).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/AdminPages/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/AdminPages/Post/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/AdminPages/Post/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/AdminPages/Post/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/AdminPages/Post/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Post/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'post', path: 'adminPages' })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesPostNewPage} name="adminPagesPostNew" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesPostEditPage} name="adminPagesPostEdit" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'userProfile', path: 'adminPages' })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesUserProfileNewPage} name="adminPagesUserProfileNew" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditPage} name="adminPagesUserProfileEdit" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'adminPages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'adminPages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'adminPages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
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
        path: 'adminPages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'adminPages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})

describe('AdminPages/Post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesMultiwordUpper).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/AdminPages/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/AdminPages/Post/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/AdminPages/Post/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/AdminPages/Post/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/AdminPages/Post/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Post/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'Post', path: 'AdminPages' })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesPostNewPage} name="adminPagesPostNew" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesPostEditPage} name="adminPagesPostEdit" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'UserProfile', path: 'AdminPages' })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesUserProfileNewPage} name="adminPagesUserProfileNew" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditPage} name="adminPagesUserProfileEdit" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'AdminPages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'AdminPages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'AdminPages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
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
        path: 'AdminPages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'AdminPages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})

describe('admin-pages/post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesMultiwordDash).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/AdminPages/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/AdminPages/Post/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/AdminPages/Post/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/AdminPages/Post/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/AdminPages/Post/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Post/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'post', path: 'admin-pages' })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesPostNewPage} name="adminPagesPostNew" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesPostEditPage} name="adminPagesPostEdit" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'userProfile', path: 'admin-pages' })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesUserProfileNewPage} name="adminPagesUserProfileNew" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditPage} name="adminPagesUserProfileEdit" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin-pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin-pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin-pages',
        tests: false,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
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
        path: 'admin-pages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin-pages',
        tests: false,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})

describe('admin_pages/post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 17 files', () => {
      expect(Object.keys(filesMultiwordUnderscore).length).toEqual(17)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/AdminPages/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostEditPage/PostEditPage.js'
          )
        ]
      ).toMatch(
        `import PostEditCell from 'src/components/AdminPages/Post/PostEditCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/AdminPages/Post/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostNewPage/PostNewPage.js'
          )
        ]
      ).toMatch(`import PostNew from 'src/components/AdminPages/Post/PostNew'`)
    })

    test('creates a show page', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/AdminPages/Post/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostEditCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Post/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'post', path: 'admin_pages' })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesPostNewPage} name="adminPagesPostNew" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesPostEditPage} name="adminPagesPostEdit" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'userProfile', path: 'admin_pages' })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesUserProfileNewPage} name="adminPagesUserProfileNew" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditPage} name="adminPagesUserProfileEdit" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin-pages',
        tests: true,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin_pages',
        tests: true,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin_pages',
        tests: true,
        oneComponentFolder: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
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
        path: 'admin_pages',
        tests: true,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileNew.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'admin_pages',
        tests: true,
        oneComponentFolder: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})
