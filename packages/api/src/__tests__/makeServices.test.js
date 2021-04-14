jest.mock('@redwoodjs/internal', () => {
  return {
    getConfig: () => ({
      api: {},
    }),
  }
})

import { makeServices } from '../makeServices'

describe('makeServices', () => {
  let services = []

  // silence warning messages in console
  beforeAll(() => {
    jest.spyOn(console, 'warn')
    console.warn.mockImplementation(() => null)
  })

  afterAll(() => {
    console.warn.mockRestore()
  })

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

  afterEach(() => {
    services = []
  })

  it('returns same services if experimentalSecureService config option is absent', () => {
    const madeServices = makeServices({ services })
    expect(madeServices).toEqual(services)
  })
})
