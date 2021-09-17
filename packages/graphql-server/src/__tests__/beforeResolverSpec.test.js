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

  describe('#add', () => {
    it('adds a single function to all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate)

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toContain(validate)
      }
    })

    it('adds multiple functions to all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validateA = () => {}
      const validateB = () => {}
      spec.add([validateA, validateB])

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toContain(validateA)
        expect(rules.validators).toContain(validateB)
      }
    })

    it('with `only` option adds a function to a single service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate, { only: ['posts'] })

      expect(spec.befores['posts'].validators).toContain(validate)
      expect(spec.befores['post'].validators).not.toContain(validate)
    })

    it('with `except` option adds a function to all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate, { except: ['posts'] })

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
      spec.add(validate)
      spec.skip()

      for (const [name, _rules] of Object.entries(spec.befores)) {
        expect(spec.befores[name].skippable).toEqual(true)
      }
    })

    it('skips a single named function from all services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate)
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
      spec.add([validateA, validateB])
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
      spec.add([validateA, validateB])
      spec.skip([validateA])

      for (const [_name, rules] of Object.entries(spec.befores)) {
        expect(rules.validators).toEqual([validateB])
        expect(rules.skippable).toEqual(false)
      }
    })

    it('with `only` option removes a named function a single service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate)
      spec.skip(validate, { only: ['posts'] })

      expect(spec.befores['posts'].skippable).toEqual(true)
      expect(spec.befores['post'].validators).toEqual([validate])
    })

    it('with only the `only` option removes all function in named services', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate)
      spec.skip({ only: ['posts'] })

      expect(spec.befores['posts'].validators).toEqual([])
      expect(spec.befores['posts'].skippable).toEqual(true)
      expect(spec.befores['post'].validators).toEqual([validate])
      expect(spec.befores['post'].skippable).toEqual(false)
    })

    it('with `except` option removes from all but one service', () => {
      const spec = new BeforeResolverSpec(services)
      const validate = () => {}
      spec.add(validate)
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
      spec.add([validateA, validateB])
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
      spec.add(validateA)
      spec.skip(validateB)

      expect(spec.befores['posts'].validators).toEqual([validateA])
    })
  })

  describe('#verify', () => {
    it('throws an error on an empty validation list', () => {
      const spec = new BeforeResolverSpec(services)

      spec.verify('posts').catch((e) => {
        expect(e).toBeInstanceOf(InsecureServiceError)
      })
    })

    it('verifies if everything is skipped', async () => {
      const spec = new BeforeResolverSpec(services)
      spec.skip()

      expect(await spec.verify('posts')).toEqual([])
    })

    it('verifies with a validation function that does not throw', async () => {
      const spec = new BeforeResolverSpec(services)
      spec.add(() => {})

      expect(await spec.verify('posts')).toEqual([undefined])
    })

    it('returns an array with the result of every validation function', async () => {
      const spec = new BeforeResolverSpec(services)
      spec.add(() => true)
      spec.add(() => false)
      spec.add(() => 'foo')

      expect(await spec.verify('posts')).toEqual([true, false, 'foo'])
    })

    it('passes name of service function to validation function', async () => {
      const spec = new BeforeResolverSpec(services)
      spec.add((name) => {
        expect(name).toEqual('posts')
      })
      await spec.verify('posts')
    })

    it('passes an undefined second argument by default', async () => {
      const spec = new BeforeResolverSpec(services)
      spec.add((_name, other) => {
        expect(other).toEqual(undefined)
      })
      await spec.verify('posts')
    })

    it('passes any additional arguments sent to the resolver', async () => {
      const spec = new BeforeResolverSpec(services)
      spec.add((_name, { foo, baz }, quux) => {
        expect(foo).toEqual('bar')
        expect(baz).toEqual('qux')
        expect(quux).toEqual('garply')
      })
      await spec.verify('posts', [{ foo: 'bar', baz: 'qux' }, 'garply'])
    })

    it('bubbles up validation errors', () => {
      const spec = new BeforeResolverSpec(services)
      spec.add(() => {
        throw new Error()
      })

      spec.verify('posts').catch((e) => {
        expect(e).toBeInstanceOf(Error)
      })
    })

    it('bubbles up validation errors if not first validation function', () => {
      const spec = new BeforeResolverSpec(services)
      spec.add(() => {
        return true
      })
      spec.add(() => {
        throw new Error()
      })

      spec.verify('posts').catch((e) => {
        expect(e).toBeInstanceOf(Error)
      })
    })
  })

  describe('integration with common scenarios', () => {
    it('requires auth everywhere, skip on read-only endpoints', () => {
      const requireAuth = () => {
        return true
      }

      const spec = new BeforeResolverSpec(services)
      spec.add(requireAuth)
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
      spec.add(requireAuth, {
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
      spec.add(requireAuth)
      spec.add(requireAuthor, {
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
