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
    nestScaffoldByModel: true,
  })
  filesMultiwordUpper = await scaffold.files({
    model: 'Post',
    path: 'AdminPages',
    tests: true,
    nestScaffoldByModel: true,
  })
  filesMultiwordDash = await scaffold.files({
    model: 'post',
    path: 'admin-pages',
    tests: true,
    nestScaffoldByModel: true,
  })
  filesMultiwordUnderscore = await scaffold.files({
    model: 'post',
    path: 'admin_pages',
    tests: true,
    nestScaffoldByModel: true,
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
          '/path/to/project/web/src/pages/AdminPages/Post/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/AdminPages/Post/EditPostCell/EditPostCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/AdminPages/Post/PostsCell/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/NewPostPage/NewPostPage.js'
          )
        ]
      ).toMatch(
        `import PostNew from 'src/components/AdminPages/Post/Post/PostNew'`
      )
    })

    test('creates a show page', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/AdminPages/Post/PostCell/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(
        `import Posts from 'src/components/AdminPages/Post/Posts/Posts'`
      )
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostNew/PostNew.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordLower[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostNew/PostNew.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm/PostForm'`
      )
    })

    test('creates a show component', async () => {
      expect(filesMultiwordLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Post/Post.js'
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
        '<Route path="/admin-pages/posts/new" page={AdminPagesPostNewPostPage} name="adminPagesNewPost" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesPostEditPostPage} name="adminPagesEditPost" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'userProfile', path: 'adminPages' })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesUserProfileNewUserProfilePage} name="adminPagesNewUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditUserProfilePage} name="adminPagesEditUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfileUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfileUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'userProfile',
        path: 'adminPages',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileCell/UserProfilesCell.js'
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
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileCell/UserProfileCell.js'
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
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfile/EditUserProfileCell/EditUserProfileCell.js'
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
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/NewUserProfile/NewUserProfile.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'userProfile',
        path: 'adminPages',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/EditUserProfileCell/EditUserProfileCell.js'
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
          '/path/to/project/web/src/layouts/AdminPages/Post/PostsLayout/PostsLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/AdminPages/Post/EditPostCell/EditPostCell'`
      )
    })

    test('creates a index page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/PostsPage/PostsPage.js'
        ),
      ])
    })

    test('the index page correctly imports the index cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(
        `import PostsCell from 'src/components/AdminPages/Post/PostsCell/PostsCell'`
      )
    })

    test('creates a new page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/NewPostPage/NewPostPage.js'
          )
        ]
      ).toMatch(
        `import PostNew from 'src/components/AdminPages/Post/PostNew/PostNew'`
      )
    })

    test('creates a show page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/Post/PostPage/PostPage.js'
        ),
      ])
    })

    test('the show page correctly imports the show cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/Post/PostPage/PostPage.js'
          )
        ]
      ).toMatch(
        `import PostCell from 'src/components/AdminPages/Post/PostCell/PostCell'`
      )
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm/PostForm'`
      )
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(
        `import Posts from 'src/components/AdminPages/Post/Posts/Posts'`
      )
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post/Post/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Post/NewPost/NewPost.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/NewPost/NewPost.js'
          )
        ]
      ).toMatch(
        `import PostForm from 'src/components/AdminPages/Post/PostForm/PostForm'`
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
        '<Route path="/admin-pages/posts/new" page={AdminPagesPostNewPostPage} name="adminPagesNewPost" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesPostEditPostPage} name="adminPagesEditPost" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({ model: 'UserProfile', path: 'AdminPages' })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesUserProfileNewUserProfilePage} name="adminPagesNewUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesUserProfileEditUserProfilePage} name="adminPagesEditUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfileUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfileUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'AdminPages',
        tests: false,
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
          '/path/to/project/web/src/pages/AdminPages/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/AdminPages/Post/EditPostCell'`
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
          '/path/to/project/web/src/pages/AdminPages/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/NewPostPage/NewPostPage.js'
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
          '/path/to/project/web/src/components/AdminPages/Post/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/EditPostCell.js'
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
        '<Route path="/admin-pages/posts/new" page={AdminPagesNewPostPage} name="adminPagesPostNew" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesEditPostPage} name="adminPagesPostEdit" />',
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
          '/path/to/project/web/src/pages/AdminPages/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/AdminPages/Post/EditPostCell'`
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
          '/path/to/project/web/src/pages/AdminPages/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/NewPostPage/NewPostPage.js'
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
          '/path/to/project/web/src/components/AdminPages/Post/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/Post/EditPostCell.js'
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
        '<Route path="/admin-pages/posts/new" page={AdminPagesNewPostPage} name="adminPagesPostNew" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesEditPostPage} name="adminPagesPostEdit" />',
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
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
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/UserProfile/UserProfileEditCell.js'
        ),
      ])
    })
  })
})
