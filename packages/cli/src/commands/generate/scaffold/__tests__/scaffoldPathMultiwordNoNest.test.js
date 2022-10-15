global.__dirname = __dirname
import path from 'path'

import '../../../../lib/test'

import * as scaffold from '../scaffold'

jest.mock('execa')

let filesMultiwordUpper
let filesMultiwordDash
let filesMultiwordUnderscore

beforeAll(async () => {
  filesMultiwordUpper = await scaffold.files({
    model: 'Post',
    path: 'AdminPages',
    tests: true,
    nestScaffoldByModel: false,
  })
  filesMultiwordDash = await scaffold.files({
    model: 'Post',
    path: 'admin-pages',
    tests: true,
    nestScaffoldByModel: false,
  })
  filesMultiwordUnderscore = await scaffold.files({
    model: 'Post',
    path: 'admin_pages',
    tests: true,
    nestScaffoldByModel: false,
  })
})

describe('AdminPages/Post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 19 files', () => {
      expect(Object.keys(filesMultiwordUpper).length).toEqual(19)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.js'
        ),
      ])
    })

    // Pages

    test('creates a edit page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/EditPostPage/EditPostPage.js'
        ),
      ])
    })

    test('the edit page correctly imports the edit cell', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/EditPostPage/EditPostPage.js'
          )
        ]
      ).toMatch(
        `import EditPostCell from 'src/components/AdminPages/EditPostCell'`
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
      ).toMatch(`import PostsCell from 'src/components/AdminPages/PostsCell'`)
    })

    test('creates a new page', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/pages/AdminPages/NewPostPage/NewPostPage.js'
        ),
      ])
    })

    test('the new page correctly imports the new component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/pages/AdminPages/NewPostPage/NewPostPage.js'
          )
        ]
      ).toMatch(`import NewPost from 'src/components/AdminPages/NewPost'`)
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
      ).toMatch(`import PostCell from 'src/components/AdminPages/PostCell'`)
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/AdminPages/PostForm'`)
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/NewPost/NewPost.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordUpper[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/NewPost/NewPost.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/AdminPages/PostForm'`)
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
        await scaffold.routes({
          model: 'Post',
          path: 'AdminPages',
          nestScaffoldByModel: false,
        })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesNewPostPage} name="adminPagesNewPost" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesEditPostPage} name="adminPagesEditPost" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({
          model: 'UserProfile',
          path: 'AdminPages',
          nestScaffoldByModel: false,
        })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesNewUserProfilePage} name="adminPagesNewUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesEditUserProfilePage} name="adminPagesEditUserProfile" />',
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
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfilesCell/UserProfilesCell.js'
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
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfileCell/UserProfileCell.js'
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
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/EditUserProfileCell/EditUserProfileCell.js'
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
        nestScaffoldByModel: false,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/NewUserProfile/NewUserProfile.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'AdminPages',
        tests: false,
        nestScaffoldByModel: false,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/EditUserProfileCell/EditUserProfileCell.js'
        ),
      ])
    })
  })
})

describe('admin-pages/Post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 19 files', () => {
      expect(Object.keys(filesMultiwordDash).length).toEqual(19)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.js'
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
        `import EditPostCell from 'src/components/AdminPages/EditPostCell'`
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
      ).toMatch(`import PostsCell from 'src/components/AdminPages/PostsCell'`)
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
      ).toMatch(`import NewPost from 'src/components/AdminPages/NewPost'`)
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
      ).toMatch(`import PostCell from 'src/components/AdminPages/PostCell'`)
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/AdminPages/PostForm'`)
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordDash).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/NewPost/NewPost.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordDash[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/NewPost/NewPost.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/AdminPages/PostForm'`)
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
        await scaffold.routes({
          model: 'Post',
          path: 'admin-pages',
          nestScaffoldByModel: false,
        })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesNewPostPage} name="adminPagesNewPost" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesEditPostPage} name="adminPagesEditPost" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({
          model: 'UserProfile',
          path: 'admin-pages',
          nestScaffoldByModel: false,
        })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesNewUserProfilePage} name="adminPagesNewUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesEditUserProfilePage} name="adminPagesEditUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin-pages',
        tests: false,
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfilesCell/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin-pages',
        tests: false,
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfileCell/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin-pages',
        tests: false,
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/EditUserProfileCell/EditUserProfileCell.js'
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
        path: 'admin-pages',
        tests: false,
        nestScaffoldByModel: false,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/NewUserProfile/NewUserProfile.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin-pages',
        tests: false,
        nestScaffoldByModel: false,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/EditUserProfileCell/EditUserProfileCell.js'
        ),
      ])
    })
  })
})

describe('admin_pages/Post', () => {
  describe('creates the correct files with the correct imports', () => {
    test('returns exactly 19 files', () => {
      expect(Object.keys(filesMultiwordUnderscore).length).toEqual(19)
    })

    // Layout

    test('creates a layout', async () => {
      expect(filesMultiwordUpper).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/layouts/ScaffoldLayout/ScaffoldLayout.js'
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
        `import EditPostCell from 'src/components/AdminPages/EditPostCell'`
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
      ).toMatch(`import PostsCell from 'src/components/AdminPages/PostsCell'`)
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
      ).toMatch(`import NewPost from 'src/components/AdminPages/NewPost'`)
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
      ).toMatch(`import PostCell from 'src/components/AdminPages/PostCell'`)
    })

    // Cells

    test('creates an edit cell', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/EditPostCell/EditPostCell.js'
        ),
      ])
    })

    test('the edit cell correctly imports the form', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/EditPostCell/EditPostCell.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/AdminPages/PostForm'`)
    })

    test('creates an index cell', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostsCell/PostsCell.js'
        ),
      ])
    })

    test('the index cell correctly imports the index component', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/PostsCell/PostsCell.js'
          )
        ]
      ).toMatch(`import Posts from 'src/components/AdminPages/Posts'`)
    })

    test('creates a show cell', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostCell/PostCell.js'
        ),
      ])
    })

    test('the show cell correctly imports the show component', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/PostCell/PostCell.js'
          )
        ]
      ).toMatch(`import Post from 'src/components/AdminPages/Post'`)
    })

    // Components

    test('creates a form component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/PostForm/PostForm.js'
        ),
      ])
    })

    test('creates an index component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/Posts/Posts.js'
        ),
      ])
    })

    test('creates a new component', async () => {
      expect(filesMultiwordUnderscore).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/NewPost/NewPost.js'
        ),
      ])
    })

    test('the new component correctly imports the form', async () => {
      expect(
        filesMultiwordUnderscore[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/NewPost/NewPost.js'
          )
        ]
      ).toMatch(`import PostForm from 'src/components/AdminPages/PostForm'`)
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
        await scaffold.routes({
          model: 'Post',
          path: 'admin_pages',
          nestScaffoldByModel: false,
        })
      ).toEqual([
        '<Route path="/admin-pages/posts/new" page={AdminPagesNewPostPage} name="adminPagesNewPost" />',
        '<Route path="/admin-pages/posts/{id:Int}/edit" page={AdminPagesEditPostPage} name="adminPagesEditPost" />',
        '<Route path="/admin-pages/posts/{id:Int}" page={AdminPagesPostPage} name="adminPagesPost" />',
        '<Route path="/admin-pages/posts" page={AdminPagesPostsPage} name="adminPagesPosts" />',
      ])
    })

    test('creates a multi-word name routes', async () => {
      expect(
        await scaffold.routes({
          model: 'UserProfile',
          path: 'admin_pages',
          nestScaffoldByModel: false,
        })
      ).toEqual([
        '<Route path="/admin-pages/user-profiles/new" page={AdminPagesNewUserProfilePage} name="adminPagesNewUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}/edit" page={AdminPagesEditUserProfilePage} name="adminPagesEditUserProfile" />',
        '<Route path="/admin-pages/user-profiles/{id:Int}" page={AdminPagesUserProfilePage} name="adminPagesUserProfile" />',
        '<Route path="/admin-pages/user-profiles" page={AdminPagesUserProfilesPage} name="adminPagesUserProfiles" />',
      ])
    })
  })

  describe('GraphQL queries', () => {
    test('the GraphQL in the index query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin-pages',
        tests: true,
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfilesCell/UserProfilesCell.js'
          )
        ]

      const query = cell.match(/(userProfiles.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the show query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin_pages',
        tests: true,
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/UserProfileCell/UserProfileCell.js'
          )
        ]

      const query = cell.match(/(userProfile.*?\})/s)[1]

      expect(query).not.toMatch(/^\s+user$/m)
    })

    test('the GraphQL in the edit query does not contain object types', async () => {
      const userProfileFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin_pages',
        tests: true,
        nestScaffoldByModel: false,
      })

      const cell =
        userProfileFiles[
          path.normalize(
            '/path/to/project/web/src/components/AdminPages/EditUserProfileCell/EditUserProfileCell.js'
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
        path: 'admin_pages',
        tests: true,
        nestScaffoldByModel: false,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/NewUserProfile/NewUserProfile.js'
        ),
      ])
    })

    test('creates an edit component with int foreign keys converted in onSave', async () => {
      const foreignKeyFiles = await scaffold.files({
        model: 'UserProfile',
        path: 'admin_pages',
        tests: true,
        nestScaffoldByModel: false,
      })

      expect(foreignKeyFiles).toHaveProperty([
        path.normalize(
          '/path/to/project/web/src/components/AdminPages/EditUserProfileCell/EditUserProfileCell.js'
        ),
      ])
    })
  })
})
