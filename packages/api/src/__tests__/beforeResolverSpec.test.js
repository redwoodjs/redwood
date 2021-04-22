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
      posts: { validators: [], skippable: false },
      post: { validators: [], skippable: false },
      createPost: { validators: [], skippable: false },
      updatePost: { validators: [], skippable: false },
      deletePost: { validators: [], skippable: false },
    })
  })

  describe('#apply', () => {
    it('adds a single function to all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toContain(validate)
      }
    })

    it('adds multiple functions to all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply([validateA, validateB])

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toContain(validateA)
        expect(rules.validators).toContain(validateB)
      }
    })

    it('with `only` option adds a function to a single service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate, { only: ['posts'] })

      expect(spec.befores['posts'].validators).toContain(validate)
      expect(spec.befores['post'].validators).not.toContain(validate)
    })

    it('with `except` option adds a function to all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate, { except: ['posts'] })

      expect(spec.befores['posts'].validators).not.toContain(validate)
      expect(spec.befores['post'].validators).toContain(validate)
    })
  })

  describe('#skip', () => {
    it('skips all functions in every service', () => {
      const spec = new BeforeResolverSpec(services)
      spec.skip()

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toEqual([])
        expect(rules.skippable).toEqual(true)
      }
    })

    it('skips everything after an apply', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip()

      for (const [name, _rules] of Object.entries(spec.befores)) {
        expect(spec.befores[name].skippable).toEqual(true)
      }
    })

    it('skips a single named function from all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip(validate)

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toEqual([])
        expect(rules.skippable).toEqual(true)
      }
    })

    it('skips multiple named functions from all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply([validateA, validateB])
      spec.skip([validateA, validateB])

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toEqual([])
        expect(rules.skippable).toEqual(true)
      }
    })

    it('skips only some functions from all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply([validateA, validateB])
      spec.skip([validateA])

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toEqual([validateB])
        expect(rules.skippable).toEqual(false)
      }
    })

    it('with `only` option removes a named function a single service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip(validate, { only: ['posts'] })

      expect(spec.befores['posts'].skippable).toEqual(true)
      expect(spec.befores['post'].validators).toEqual([validate])
    })

    it('with only the `only` option removes all function in named services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip({ only: ['posts'] })

      expect(spec.befores['posts'].validators).toEqual([])
      expect(spec.befores['posts'].skippable).toEqual(true)
      expect(spec.befores['post'].validators).toEqual([validate])
      expect(spec.befores['post'].skippable).toEqual(false)
    })

    it('with `except` option removes from all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.apply(validate)
      spec.skip(validate, { except: ['posts'] })

      expect(spec.befores['posts'].validators).toEqual([validate])
      expect(spec.befores['posts'].skippable).toEqual(false)
      expect(spec.befores['post'].validators).toEqual([])
      expect(spec.befores['post'].skippable).toEqual(true)
    })

    it('with only the `except` option removes all functions from all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply([validateA, validateB])
      spec.skip({ except: ['posts'] })

      expect(spec.befores['posts'].validators).toEqual([validateA, validateB])
      expect(spec.befores['posts'].skippable).toEqual(false)
      expect(spec.befores['post'].validators).toEqual([])
      expect(spec.befores['post'].skippable).toEqual(true)
    })

    // shouldn't be a problem to skip something that doesn't exist
    it('does not mind skipping a function that does not exist', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.apply(validateA)
      spec.skip(validateB)

      expect(spec.befores['posts'].validators).toEqual([validateA])
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

      expect(spec.verify('posts')).toEqual([])
    })

    it('verifies with a validation function that does not throw', () => {
      const spec = new BeforeResolverSpec(services)
      spec.apply(() => {})

      expect(spec.verify('posts')).toEqual([undefined])
    })

    it('returns an array with the result of every validation function', () => {
      const spec = new BeforeResolverSpec(services)
      spec.apply(() => true)
      spec.apply(() => false)
      spec.apply(() => 'foo')

      expect(spec.verify('posts')).toEqual([true, false, 'foo'])
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

  describe('integration with common scenarios', () => {
    it('requires auth everywhere, skip on read-only endpoints', () => {
      const requireAuth = () => {
        return true
      }

      const spec = new BeforeResolverSpec(services)
      spec.apply(requireAuth)
      spec.skip({ only: ['posts', 'post'] })

      expect(spec.verify('posts'))
      expect(spec.befores['posts'].validators.length).toEqual(0)
      expect(spec.verify('post'))
      expect(spec.befores['posts'].validators.length).toEqual(0)
      expect(spec.verify('createPost'))
      expect(spec.befores['createPost'].validators.length).toEqual(1)
      expect(spec.verify('updatePost'))
      expect(spec.befores['updatePost'].validators.length).toEqual(1)
      expect(spec.verify('deletePost'))
      expect(spec.befores['deletePost'].validators.length).toEqual(1)
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

      expect(spec.verify('posts'))
      expect(spec.befores['posts'].validators.length).toEqual(0)
      expect(spec.verify('post'))
      expect(spec.befores['post'].validators.length).toEqual(0)
      expect(spec.verify('createPost'))
      expect(spec.befores['createPost'].validators.length).toEqual(1)
      expect(spec.verify('updatePost'))
      expect(spec.befores['updatePost'].validators.length).toEqual(1)
      expect(spec.verify('deletePost'))
      expect(spec.befores['deletePost'].validators.length).toEqual(1)
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

      expect(spec.verify('posts'))
      expect(spec.befores['posts'].validators.length).toEqual(1)
      expect(spec.verify('post'))
      expect(spec.befores['post'].validators.length).toEqual(1)
      expect(spec.verify('createPost'))
      expect(spec.befores['createPost'].validators.length).toEqual(2)
      expect(spec.verify('updatePost'))
      expect(spec.befores['updatePost'].validators.length).toEqual(2)
      expect(spec.verify('deletePost'))
      expect(spec.befores['deletePost'].validators.length).toEqual(2)
    })
  })
})
