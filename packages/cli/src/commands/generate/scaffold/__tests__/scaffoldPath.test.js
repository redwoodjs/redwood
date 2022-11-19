global.__dirname = __dirname
import path from 'path'

import '../../../../lib/test'

import * as scaffold from '../scaffold'

jest.mock('execa')

describe('admin/post', () => {
  let filesLower

  beforeAll(async () => {
    filesLower = await scaffold.files({
      model: 'Post',
      path: 'admin',
      tests: true,
      nestScaffoldByModel: true,
    })
  })

  describe('creates the correct files with the correct imports', () => {
    it('returns exactly 19 files', () => {
      expect(Object.keys(filesLower).length).toEqual(19)
    })

    // Layout
    it('creates a layout', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.js'
        ),
      ])
    })

    // Pages

    it('creates a edit page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    it('the edit page correctly imports the edit cell', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/Admin/Post/EditPostCell'`
      )
    })

    it('creates a index page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostsPage/PostsPage.js'
        ),
      ])
    })

    it('the index page correctly imports the index cell', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(`import PostsCell from 'src/components/Admin/Post/PostsCell'`)
    })

    it('creates a new page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    it('the new page correctly imports the new component', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/NewPostPage/NewPostPage.js'
          )
        ]
      ).toMatch(`import NewPost from 'src/components/Admin/Post/NewPost'`)
    })

    it('creates a show page', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostPage/PostPage.js'
        ),
      ])
    })

    it('the show page correctly imports the show cell', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostPage/PostPage.js'
          )
        ]
      ).toMatch(`import PostCell from 'src/components/Admin/Post/PostCell'`)
    })

    // Cells

    it('creates an edit cell', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    it('the edit cell correctly imports the form', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/Post/PostForm'`)
    })

    it('creates an index cell', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostsCell/PostsCell.js'
        ),
      ])
    })

    it('the index cell correctly imports the index component', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/Admin/Post/Posts'`)
    })

    it('creates a show cell', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostCell/PostCell.js'
        ),
      ])
    })

    it('the show cell correctly imports the show component', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/Admin/Post/Post'`)
    })

    // Components

    it('creates a form component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostForm/PostForm.js'
        ),
      ])
    })

    it('creates an index component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/Posts/Posts.js'
        ),
      ])
    })

    it('creates a new component', async () => {
      expect(filesLower).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/NewPost/NewPost.js'
        ),
      ])
    })

    it('the new component correctly imports the form', async () => {
      expect(
        filesLower[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/NewPost/NewPost.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/Post/PostForm'`)
    })

    it('creates a show component', async () => {
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
      expect(
        await scaffold.routes({
          model: 'Post',
          path: 'admin',
          nestScaffoldByModel: true,
        })
      ).toEqual([
        '<Route path="/admin/posts/new" page={AdminPostNewPostPage} name="adminNewPost" />',
        '<Route path="/admin/posts/{id:Int}/edit" page={AdminPostEditPostPage} name="adminEditPost" />',
        '<Route path="/admin/posts/{id:Int}" page={AdminPostPostPage} name="adminPost" />',
        '<Route path="/admin/posts" page={AdminPostPostsPage} name="adminPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({
          model: 'UserProfile',
          path: 'admin',
          nestScaffoldByModel: true,
        })
      ).toEqual([
        '<Route path="/admin/user-profiles/new" page={AdminUserProfileNewUserProfilePage} name="adminNewUserProfile" />',
        '<Route path="/admin/user-profiles/{id:Int}/edit" page={AdminUserProfileEditUserProfilePage} name="adminEditUserProfile" />',
        '<Route path="/admin/user-profiles/{id:Int}" page={AdminUserProfileUserProfilePage} name="adminUserProfile" />',
        '<Route path="/admin/user-profiles" page={AdminUserProfileUserProfilesPage} name="adminUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfile/UserProfilesCell/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfile/UserProfileCell/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/Admin/UserProfile/EditUserProfileCell/EditUserProfileCell.js'
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
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/UserProfile/NewUserProfile/NewUserProfile.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin',
        tests: false,
        nestScaffoldByModel: true,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/UserProfile/EditUserProfileCell/EditUserProfileCell.js'
        ),
      ])
    })
  })
})

describe('Admin/Post', () => {
  let filesUpper
  beforeAll(async () => {
    filesUpper = await scaffold.files({
      model: 'Post',
      path: 'Admin',
      tests: true,
      nestScaffoldByModel: true,
    })
  })

  describe('creates the correct files with the correct imports', () => {
    it('returns exactly 19 files', () => {
      expect(Object.keys(filesUpper).length).toEqual(19)
    })

    // Layout

    it('creates a layout', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.js'
        ),
      ])
    })

    // Pages

    it('creates a edit page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    it('the edit page correctly imports the edit cell', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/Admin/Post/EditPostCell'`
      )
    })

    it('creates a index page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostsPage/PostsPage.js'
        ),
      ])
    })

    it('the index page correctly imports the index cell', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostsPage/PostsPage.js'
          )
        ]
      ).toMatch(`import PostsCell from 'src/components/Admin/Post/PostsCell'`)
    })

    it('creates a new page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    it('the new page correctly imports the new component', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/NewPostPage/NewPostPage.js'
          )
        ]
      ).toMatch(`import NewPost from 'src/components/Admin/Post/NewPost'`)
    })

    it('creates a show page', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/Admin/Post/PostPage/PostPage.js'
        ),
      ])
    })

    it('the show page correctly imports the show cell', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/pages/Admin/Post/PostPage/PostPage.js'
          )
        ]
      ).toMatch(`import PostCell from 'src/components/Admin/Post/PostCell'`)
    })

    // Cells

    it('creates an edit cell', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    it('the edit cell correctly imports the form', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/Post/PostForm'`)
    })

    it('creates an index cell', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostsCell/PostsCell.js'
        ),
      ])
    })

    it('the index cell correctly imports the index component', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/Admin/Post/Posts'`)
    })

    it('creates a show cell', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostCell/PostCell.js'
        ),
      ])
    })

    it('the show cell correctly imports the show component', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/Admin/Post/Post'`)
    })

    // Components

    it('creates a form component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/PostForm/PostForm.js'
        ),
      ])
    })

    it('creates an index component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/Posts/Posts.js'
        ),
      ])
    })

    it('the index component correctly imports the QUERY', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/Posts/Posts.js'
          )
        ]
      ).toMatch(`import { QUERY } from 'src/components/Admin/Post/PostsCell'`)
    })

    it('the new component correctly imports the form', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/NewPost/NewPost.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/Post/PostForm'`)
    })

    it('creates a new component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/NewPost/NewPost.js'
        ),
      ])
    })

    it('the new component correctly imports the form', async () => {
      expect(
        filesUpper[
          path.normalize(
            '/path/to/project/web/src/components/Admin/Post/NewPost/NewPost.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/Admin/Post/PostForm'`)
    })

    it('creates a show component', async () => {
      expect(filesUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/Admin/Post/Post/Post.js'
        ),
      ])
    })
  })

  describe('creates the correct routes', () => {
    // Routes

    test('creates a single-word name routes', async () => {
      expect(
        await scaffold.routes({
          model: 'Post',
          path: 'Admin',
          nestScaffoldByModel: true,
        })
      ).toEqual([
        '<Route path="/admin/posts/new" page={AdminPostNewPostPage} name="adminNewPost" />',
        '<Route path="/admin/posts/{id:Int}/edit" page={AdminPostEditPostPage} name="adminEditPost" />',
        '<Route path="/admin/posts/{id:Int}" page={AdminPostPostPage} name="adminPost" />',
        '<Route path="/admin/posts" page={AdminPostPostsPage} name="adminPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({
          model: 'UserProfile',
          path: 'Admin',
          nestScaffoldByModel: true,
        })
      ).toEqual([
        '<Route path="/admin/user-profiles/new" page={AdminUserProfileNewUserProfilePage} name="adminNewUserProfile" />',
        '<Route path="/admin/user-profiles/{id:Int}/edit" page={AdminUserProfileEditUserProfilePage} name="adminEditUserProfile" />',
        '<Route path="/admin/user-profiles/{id:Int}" page={AdminUserProfileUserProfilePage} name="adminUserProfile" />',
        '<Route path="/admin/user-profiles" page={AdminUserProfileUserProfilesPage} name="adminUserProfiles" />',
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
            '/path/to/project/web/src/components/Admin/UserProfile/UserProfilesCell/UserProfilesCell.js'
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
            '/path/to/project/web/src/components/Admin/UserProfile/UserProfileCell/UserProfileCell.js'
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
            '/path/to/project/web/src/components/Admin/UserProfile/EditUserProfileCell/EditUserProfileCell.js'
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
          '/path/to/project/web/src/components/Admin/UserProfile/NewUserProfile/NewUserProfile.js'
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
          '/path/to/project/web/src/components/Admin/UserProfile/EditUserProfileCell/EditUserProfileCell.js'
        ),
      ])
    })
  })
})
