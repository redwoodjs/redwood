import { BeforeResolverSpec, InsecureServiceError } from '../beforeResolverSpec'

describe('BeforeResolverSpec', () => {
  let services = []

  beforeEach(() => {
    services = ['posts', 'post', 'createPost', 'updatePost', 'deletePost']
  })

  afterEach(() => {
    services = []
  })

  it('initializes services', async () => {
    const spec = new BeforeResolverSpec(services)

    expect(spec.befores).toEqual({
      posts: [],
      post: [],
      createPost: [],
      updatePost: [],
      deletePost: [],
    })
  })

  describe('#apply', () => {
    it('adds a single function to all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)

      for (const [_name, funcs] of Object.entries(spec.befores)) {
        expect(funcs).toContain(validate)
      }
    })

    it('adds multiple functions to all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply([validateA, validateB])

      for (const [_name, funcs] of Object.entries(spec.befores)) {
        expect(funcs).toContain(validateA)
        expect(funcs).toContain(validateB)
      }
    })

    it('with `only` option adds a function to a single service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate, { only: ['posts'] })

      expect(spec.befores['posts']).toContain(validate)
      expect(spec.befores['post']).not.toContain(validate)
    })

    it('with `except` option adds a function to all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate, { except: ['posts'] })

      expect(spec.befores['posts']).not.toContain(validate)
      expect(spec.befores['post']).toContain(validate)
    })
  })

  describe('#skip', () => {
    it('skips all functions in every service', () => {
      const spec = new BeforeResolverSpec(services)
      spec.skip()

      for (const [_name, funcs] of Object.entries(spec.befores)) {
        expect(funcs).toEqual(false)
      }
    })

    it('skips a single named function from all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip(validate)

      for (const [_name, funcs] of Object.entries(spec.befores)) {
        expect(funcs).toEqual(false)
      }
    })

    it('skips multiple named functions from all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply([validateA, validateB])
      spec.skip([validateA, validateB])

      for (const [_name, funcs] of Object.entries(spec.befores)) {
        expect(funcs).toEqual(false)
      }
    })

    it('with `only` option removes a named function a single service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip(validate, { only: ['posts'] })

      expect(spec.befores['posts']).toEqual(false)
      expect(spec.befores['post']).toEqual([validate])
    })

    it('with `only` option removes all function in named services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip({ only: ['posts'] })

      expect(spec.befores['posts']).toEqual(false)
      expect(spec.befores['post']).toEqual([validate])
    })

    it('with `except` option removes from all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip(validate, { except: ['posts'] })

      expect(spec.befores['posts']).toEqual([validate])
      expect(spec.befores['post']).toEqual(false)
    })

    // shouldn't be a problem to skip something that doesn't exist
    it('does not mind skipping a function that does not exist', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply(validateA)
      spec.skip(validateB)

      expect(spec.befores['posts']).toEqual([validateA])
    })

    it('skips everything with no arguments', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip()

      for (const [name, _funcs] of Object.entries(spec.befores)) {
        expect(spec.befores[name]).toEqual(false)
      }
    })
  })

  describe('#verify', () => {
    it('throws an error on an empty validation list', () => {
      const spec = new BeforeResolverSpec(services)

      expect(() => {
        spec.verify('posts')
      }).toThrow(InsecureServiceError)
    })

    it('verifies if everything is skipped', () => {
      const spec = new BeforeResolverSpec(services)
      spec.skip()

      expect(spec.verify('posts')).toEqual(true)
    })

    it('verifies with a validation function that does not throw', () => {
      const spec = new BeforeResolverSpec(services)
      spec.apply(() => {})

      expect(spec.verify('posts')).toEqual(true)
    })

    it('passes name of service function to validation function', () => {
      const spec = new BeforeResolverSpec(services)
      spec.apply((name) => {
        expect(name).toEqual('posts')
      })
      spec.verify('posts')
    })

    it('bubbles up validation errors', () => {
      const spec = new BeforeResolverSpec(services)
      spec.apply(() => {
        throw new Error()
      })

      expect(() => spec.verify('posts')).toThrow(Error)
    })

    it('bubbles up validation errors if not first validation function', () => {
      const spec = new BeforeResolverSpec(services)
      spec.apply(() => {
        return true
      })
      spec.apply(() => {
        throw new Error()
      })

      expect(() => spec.verify('posts')).toThrow(Error)
    })
  })

  describe('common scenarios', () => {
    it('requires auth everywhere, skip on read-only endpoints', () => {
      const requireAuth = () => {
        return true
      }

      const spec = new BeforeResolverSpec(services)
      spec.apply(requireAuth)
      spec.skip({ only: ['posts', 'post'] })

      expect(spec.befores['posts']).toEqual(false)
      expect(spec.befores['post']).toEqual(false)
      expect(spec.befores['createPost']).toEqual([requireAuth])
      expect(spec.befores['updatePost']).toEqual([requireAuth])
      expect(spec.befores['deletePost']).toEqual([requireAuth])
      expect(spec.verify('posts'))
      expect(spec.verify('post'))
      expect(spec.verify('createPost'))
      expect(spec.verify('updatePost'))
      expect(spec.verify('deletePost'))
    })

    it('skip all first, then requires auth on secure endpoints', () => {
      const requireAuth = () => {
        return true
      }

      const spec = new BeforeResolverSpec(services)
      spec.skip()
      spec.apply(requireAuth, {
        only: ['createPost', 'updatePost', 'deletePost'],
      })

      expect(spec.befores['posts']).toEqual(false)
      expect(spec.befores['post']).toEqual(false)
      expect(spec.befores['createPost']).toEqual([requireAuth])
      expect(spec.befores['updatePost']).toEqual([requireAuth])
      expect(spec.befores['deletePost']).toEqual([requireAuth])
      expect(spec.verify('posts'))
      expect(spec.verify('post'))
      expect(spec.verify('createPost'))
      expect(spec.verify('updatePost'))
      expect(spec.verify('deletePost'))
    })

    it('requires auth everywhere, additional requirements on secure endpoints', () => {
      const requireAuth = () => {
        return true
      }
      const requireAuthor = () => {
        return true
      }

      const spec = new BeforeResolverSpec(services)
      spec.apply(requireAuth)
      spec.apply(requireAuthor, {
        only: ['createPost', 'updatePost', 'deletePost'],
      })

      expect(spec.befores['posts']).toEqual([requireAuth])
      expect(spec.befores['post']).toEqual([requireAuth])
      expect(spec.befores['createPost']).toEqual([requireAuth, requireAuthor])
      expect(spec.befores['updatePost']).toEqual([requireAuth, requireAuthor])
      expect(spec.befores['deletePost']).toEqual([requireAuth, requireAuthor])
      expect(spec.verify('posts'))
      expect(spec.verify('post'))
      expect(spec.verify('createPost'))
      expect(spec.verify('updatePost'))
      expect(spec.verify('deletePost'))
    })
  })
})
