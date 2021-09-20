import { makeServices } from '../makeServices'

describe('makeServices', () => {
  let services = []

  let servicesWithoutBeforeResolver = []

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
        beforeResolver: () => {},
        posts: () => {},
        post: () => {},
        createPost: () => {},
        updatePost: () => {},
        deletePost: () => {},
      },
    }

    servicesWithoutBeforeResolver = {
      tags_tags: {
        tags: () => {},
        tag: () => {},
        createTag: () => {},
        updateTag: () => {},
        deleteTag: () => {},
      },
    }
  })

  afterEach(() => {
    services = []
  })

  it('just returns services if no before resolver present', () => {
    const madeServices = makeServices({
      services: servicesWithoutBeforeResolver,
    })
    expect(madeServices).toBe(servicesWithoutBeforeResolver)
  })

  it('does not include beforeResolver() in returned services', () => {
    const madeServices = makeServices({ services })

    expect(Object.keys(madeServices.posts_posts)).not.toContain(
      'beforeResolver'
    )
  })
})
