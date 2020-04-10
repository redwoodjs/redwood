global.__dirname = __dirname
import path from 'path'

import {
  loadFixture,
  loadGeneratorFixture,
  sdlFixturesPath,
  serviceFixturesPath,
} from 'src/lib/test'

import * as scaffold from '../scaffold'

let files

beforeAll(async () => {
  files = await scaffold.files({ model: 'Post' })
})

test('returns exactly 16 files', () => {
  expect(Object.keys(files).length).toEqual(16)
})

// styles

test('creates a stylesheet', () => {
  expect(files['/path/to/project/web/src/scaffold.css']).toEqual(
    loadGeneratorFixture('scaffold', path.join('assets', 'scaffold.css'))
  )
})

// SDL

test('creates a graphql sdl', () => {
  expect(files['/path/to/project/api/src/graphql/posts.sdl.js']).toEqual(
    loadFixture(path.join(sdlFixturesPath, 'singleWordSdlCrud.js'))
  )
})

// Service

test('creates a service', () => {
  expect(files['/path/to/project/api/src/services/posts/posts.js']).toEqual(
    loadFixture(path.join(serviceFixturesPath, 'singleWordServiceCrud.js'))
  )
})

test('creates a service test', () => {
  expect(
    files['/path/to/project/api/src/services/posts/posts.test.js']
  ).toEqual(
    loadFixture(path.join(serviceFixturesPath, 'singleWordServiceCrud.test.js'))
  )
})

// Layout

test('creates a layout', async () => {
  expect(
    files['/path/to/project/web/src/layouts/PostsLayout/PostsLayout.js']
  ).toEqual(loadGeneratorFixture('scaffold', path.join('layouts', 'layout.js')))
})

// Pages

test('creates a edit page', async () => {
  expect(
    files['/path/to/project/web/src/pages/EditPostPage/EditPostPage.js']
  ).toEqual(loadGeneratorFixture('scaffold', path.join('pages', 'editPage.js')))
})

test('creates a index page', async () => {
  expect(
    files['/path/to/project/web/src/pages/PostsPage/PostsPage.js']
  ).toEqual(
    loadGeneratorFixture('scaffold', path.join('pages', 'indexPage.js'))
  )
})

test('creates a new page', async () => {
  expect(
    files['/path/to/project/web/src/pages/NewPostPage/NewPostPage.js']
  ).toEqual(loadGeneratorFixture('scaffold', path.join('pages', 'newPage.js')))
})

test('creates a show page', async () => {
  expect(files['/path/to/project/web/src/pages/PostPage/PostPage.js']).toEqual(
    loadGeneratorFixture('scaffold', path.join('pages', 'showPage.js'))
  )
})

// Cells

test('creates an edit cell', async () => {
  expect(
    files['/path/to/project/web/src/components/EditPostCell/EditPostCell.js']
  ).toEqual(
    loadGeneratorFixture('scaffold', path.join('components', 'editCell.js'))
  )
})

test('creates an index cell', async () => {
  expect(
    files['/path/to/project/web/src/components/PostsCell/PostsCell.js']
  ).toEqual(
    loadGeneratorFixture('scaffold', path.join('components', 'indexCell.js'))
  )
})

test('creates a show cell', async () => {
  expect(
    files['/path/to/project/web/src/components/PostCell/PostCell.js']
  ).toEqual(
    loadGeneratorFixture('scaffold', path.join('components', 'showCell.js'))
  )
})

// Components

test('creates a form component', async () => {
  expect(
    files['/path/to/project/web/src/components/PostForm/PostForm.js']
  ).toEqual(
    loadGeneratorFixture('scaffold', path.join('components', 'form.js'))
  )
})

test('creates an index component', async () => {
  expect(files['/path/to/project/web/src/components/Posts/Posts.js']).toEqual(
    loadGeneratorFixture('scaffold', path.join('components', 'index.js'))
  )
})

test('creates a new component', async () => {
  expect(
    files['/path/to/project/web/src/components/NewPost/NewPost.js']
  ).toEqual(loadGeneratorFixture('scaffold', path.join('components', 'new.js')))
})

test('creates a show component', async () => {
  expect(files['/path/to/project/web/src/components/Post/Post.js']).toEqual(
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
