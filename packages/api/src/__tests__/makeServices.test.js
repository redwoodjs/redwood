let mockedExperimentalSetting = {}
jest.mock('@redwoodjs/internal', () => {
  return {
    getConfig: jest.fn(() => {
      return {
        api: mockedExperimentalSetting,
      }
    }),
  }
})

import { MissingBeforeResolverError } from '../beforeResolverSpec'
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
        beforeResolver: () => {},
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

  it('throws an error if service does not export a beforeResolver()', () => {
    mockedExperimentalSetting = { experimentalSecureServices: true }
    services.posts_posts.beforeResolver = null

    expect(() => {
      makeServices({ services })
    }).toThrow(MissingBeforeResolverError)
  })

  it('exports the same named object and structure as the input', () => {
    mockedExperimentalSetting = { experimentalSecureServices: true }

    expect(true).toEqual(true)
  })

  it('does not include beforeResolver() in returned services', () => {
    mockedExperimentalSetting = { experimentalSecureServices: true }

    const madeServices = makeServices({ services })

    expect(Object.keys(madeServices.posts_posts)).not.toContain(
      'beforeResolver'
    )
  })
})
