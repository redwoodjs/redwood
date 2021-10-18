import { makeServices } from '../makeServices'

describe('makeServices', () => {
  let services = []

  beforeEach(() => {
    services = {
      posts_posts: {
        posts: () => {},
        post: () => {},
        createPost: () => {},
        updatePost: () => {},
        deletePost: () => {},
      },
    }
  })

  it('just returns services', () => {
    const madeServices = makeServices({
      services,
    })
    const postsService = madeServices.posts_posts
    expect(postsService).toHaveProperty('posts')
    expect(postsService).toHaveProperty('post')
    expect(postsService).toHaveProperty('createPost')
    expect(postsService).toHaveProperty('updatePost')
    expect(postsService).toHaveProperty('deletePost')
  })
})
