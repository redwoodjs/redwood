global.__dirname = __dirname
import { loadGeneratorFixture } from 'src/lib/test'

import * as scaffold from '../scaffold'

let files

beforeAll(() => {
  // files = scaffold.files({ name: 'Home' })
})

test('true', () => {
  expect(true).toEqual(true)
})

// describe('scaffold', () => {
//   it('files', async (done) => {
//     const files = await scaffold.files({ model: 'Post' })
//     expect(files).toMatchSnapshot()
//     done()
//   })

//   it('routes', async (done) => {
//     expect(await scaffold.routes({ model: 'Post' })).toEqual([
//       '<Route path="/posts/new" page={NewPostPage} name="newPost" />',
//       '<Route path="/posts/{id:Int}/edit" page={EditPostPage} name="editPost" />',
//       '<Route path="/posts/{id:Int}" page={PostPage} name="post" />',
//       '<Route path="/posts" page={PostsPage} name="posts" />',
//     ])
//     done()
//   })
// })
