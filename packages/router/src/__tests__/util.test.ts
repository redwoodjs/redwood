import {
  paramsForRoute,
  matchPath,
  parseSearch,
  validatePath,
  flattenSearchParams,
  replaceParams,
} from '../util'

describe('paramsForRoute', () => {
  it.each([
    ['/post/{slug}', [['slug', 'String', '{slug}']]],
    ['/post/{slug...}', [['slug', 'Glob', '{slug...}']]],
    ['/id/{id:Int}', [['id', 'Int', '{id:Int}']]],
  ])('extracts name and type info', (route, info) => {
    expect(paramsForRoute(route)).toEqual(info)
  })
})

describe('matchPath', () => {
  it.each([
    ['/post/{id:Int}', '/post/notAnInt'],
    ['/post/{id:Int}', '/post/2.0'],
    ['/post/{id:Int}', '/post/.1'],
    ['/post/{id:Int}', '/post/0.1'],
    ['/post/{id:Int}', '/post/123abcd'],
    ['/post/{id:Int}', '/post/abcd123'],
    ['/blog/{year}/{month:Int}/{day}', '/blog/2019/december/07'],
    ['/blog/{year}/{month}/{day}', '/blog/2019/07'],
    ['/posts/{id}/edit', '/posts//edit'],
    ['/about', '/'],
  ])('does not match route "%s" with path "%s"', (route, pathname) => {
    expect(matchPath(route, pathname)).toEqual({ match: false })
  })

  it('matches valid paths and extracts params correctly', () => {
    expect(matchPath('/blog/{year}/{month}/{day}', '/blog/2019/12/07')).toEqual(
      { match: true, params: { day: '07', month: '12', year: '2019' } }
    )
  })

  it('transforms a param for Int', () => {
    expect(matchPath('/post/{id}', '/post/1337')).toEqual({
      match: true,
      params: { id: '1337' },
    })

    expect(matchPath('/post/{id:Int}', '/post/1337')).toEqual({
      match: true,
      params: { id: 1337 },
    })

    expect(matchPath('/post/id-{id:Int}', '/post/id-37')).toEqual({
      match: true,
      params: { id: 37 },
    })

    expect(matchPath('/post/{id:Int}-id', '/post/78-id')).toEqual({
      match: true,
      params: { id: 78 },
    })

    expect(matchPath('/post/id-{id:Int}-id', '/post/id-789-id')).toEqual({
      match: true,
      params: { id: 789 },
    })

    expect(matchPath('/{id:Int}/bazinga', '/89/bazinga')).toEqual({
      match: true,
      params: { id: 89 },
    })
  })

  it('transforms a param for Boolean', () => {
    expect(matchPath('/signedUp/{status:Boolean}', '/signedUp/true')).toEqual({
      match: true,
      params: {
        status: true,
      },
    })

    expect(matchPath('/signedUp/{status:Boolean}', '/signedUp/false')).toEqual({
      match: true,
      params: {
        status: false,
      },
    })

    expect(
      matchPath('/signedUp/x-{status:Boolean}', '/signedUp/x-false')
    ).toEqual({
      match: true,
      params: {
        status: false,
      },
    })

    expect(
      matchPath('/signedUp/{status:Boolean}y', '/signedUp/falsey')
    ).toEqual({
      match: true,
      params: {
        status: false,
      },
    })

    expect(
      matchPath('/signedUp/e{status:Boolean}y', '/signedUp/efalsey')
    ).toEqual({
      match: true,
      params: {
        status: false,
      },
    })

    expect(
      matchPath('/signedUp/{status:Boolean}', '/signedUp/somethingElse')
    ).toEqual({
      match: false,
    })
  })

  it('transforms a param for Floats', () => {
    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/1.58')
    ).toEqual({
      match: true,
      params: {
        floatyMcFloat: 1.58,
      },
    })

    expect(matchPath('/version/{floatyMcFloat:Float}', '/version/626')).toEqual(
      {
        match: true,
        params: {
          floatyMcFloat: 626,
        },
      }
    )

    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/+0.92')
    ).toEqual({
      match: true,
      params: {
        floatyMcFloat: 0.92,
      },
    })

    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/-5.5')
    ).toEqual({
      match: true,
      params: {
        floatyMcFloat: -5.5,
      },
    })

    expect(matchPath('/version/{floatyMcFloat:Float}', '/version/4e8')).toEqual(
      {
        match: true,
        params: {
          floatyMcFloat: 4e8,
        },
      }
    )

    expect(
      matchPath('/version/{floatyMcFloat:Float}', '/version/noMatchMe')
    ).toEqual({
      match: false,
    })
  })

  it('transforms a param for Globs', () => {
    //single
    expect(matchPath('/version/{path...}', '/version/path/to/file')).toEqual({
      match: true,
      params: {
        path: 'path/to/file',
      },
    })

    //  multiple
    expect(matchPath('/a/{a...}/b/{b...}/c', '/a/1/2/b/3/4/c')).toEqual({
      match: true,
      params: {
        a: '1/2',
        b: '3/4',
      },
    })

    // adjacent
    expect(matchPath('/a/{a...}{b...}/c', '/a/1/2/3/4/c')).toEqual({
      match: true,
      params: {
        a: '1/2/3/4',
        b: '',
      },
    })

    // adjacent with a slash
    expect(matchPath('/a/{a...}/{b...}/c', '/a/1/2/3/4/c')).toEqual({
      match: true,
      params: {
        a: '1/2/3',
        b: '4',
      },
    })

    // prefixed
    expect(matchPath('/a-{a...}', '/a-1/2')).toEqual({
      match: true,
      params: {
        a: '1/2',
      },
    })

    // suffixed
    expect(matchPath('/{a...}-a/kittens', '/1/2-a/kittens')).toEqual({
      match: true,
      params: {
        a: '1/2',
      },
    })
  })

  it('handles multiple typed params', () => {
    expect(
      matchPath(
        '/dashboard/document/{id:Int}/{version:Float}/edit/{edit:Boolean}/{path...}/terminate',
        '/dashboard/document/44/1.8/edit/false/path/to/file/terminate'
      )
    ).toEqual({
      match: true,
      params: { id: 44, version: 1.8, edit: false, path: 'path/to/file' },
    })
  })
})

describe('validatePath', () => {
  it.each(['invalid/route', '{id}/invalid/route', ' /invalid/route'])(
    'rejects "%s" path that does not begin with a slash',
    (path) => {
      expect(validatePath.bind(null, path)).toThrowError(
        `Route path does not begin with a slash: "${path}"`
      )
    }
  )

  it.each([
    '/path/to/user profile',
    '/path/ to/userprofile',
    '/path/to /userprofile',
    '/path/to/users/{id: Int}',
    '/path/to/users/{id :Int}',
    '/path/to/users/{id : Int}',
    '/path/to/users/{ id:Int}',
    '/path/to/users/{id:Int }',
    '/path/to/users/{ id:Int }',
    '/path/to/users/{ id : Int }',
  ])('rejects paths with spaces: "%s"', (path) => {
    expect(validatePath.bind(null, path)).toThrowError(
      `Route path contains spaces: "${path}"`
    )
  })

  it.each([
    '/users/{id}/photos/{id}',
    '/users/{id}/photos/{id:Int}',
    '/users/{id:Int}/photos/{id}',
    '/users/{id:Int}/photos/{id:Int}',
  ])('rejects path "%s" with duplicate params', (path) => {
    expect(validatePath.bind(null, path)).toThrowError(
      `Route path contains duplicate parameter: "${path}"`
    )
  })

  it.each([
    '/users/{id:Int}/photos/{photo_id:Int}',
    '/users/{id}/photos/{photo_id}',
    '/users/{id}/photos/{photo_id}?format=jpg&w=400&h=400',
    '/',
    '/404',
    '/about',
    '/about/redwood',
  ])('validates correct path "%s"', (path) => {
    expect(validatePath.bind(null, path)).not.toThrow()
  })

  it.each([
    '/path/{ref}',
    '/path/{ref}/bazinga',
    '/path/{ref:Int}',
    '/path/{ref:Int}/bazinga',
    '/path/{key}',
    '/path/{key}/bazinga',
    '/path/{key:Int}',
  ])('rejects paths with ref or key as path parameters: "%s"', (path) => {
    expect(validatePath.bind(null, path)).toThrowError(
      [
        `Route contains ref or key as a path parameter: "${path}"`,
        "`ref` and `key` shouldn't be used as path parameters because they're special React props.",
        'You can fix this by renaming the path parameter.',
      ].join('\n')
    )
  })

  it.each([
    '/path/{reff}',
    '/path/{reff:Int}',
    '/path/{reff}/bazinga',
    '/path/{keys}',
    '/path/{keys:Int}',
    '/path/key',
    '/path/key/bazinga',
  ])(
    `doesn't reject paths with variations on ref or key as path parameters: "%s"`,
    (path) => {
      expect(validatePath.bind(null, path)).not.toThrowError()
    }
  )
})

describe('parseSearch', () => {
  it('deals silently with an empty search string', () => {
    expect(parseSearch('')).toEqual({})
  })

  it('correctly parses a search string', () => {
    expect(
      parseSearch('?search=all+dogs+go+to+heaven&category=movies')
    ).toEqual({ category: 'movies', search: 'all dogs go to heaven' })
  })
})

describe('flattenSearchParams', () => {
  it('returns a flat array from query string', () => {
    expect(
      flattenSearchParams('?search=all+dogs+go+to+heaven&category=movies')
    ).toEqual([{ search: 'all dogs go to heaven' }, { category: 'movies' }])
  })

  it('returns an empty array', () => {
    expect(flattenSearchParams('')).toEqual([])
  })
})

describe('replaceParams', () => {
  it('throws an error on missing params', () => {
    expect(() => replaceParams('/tags/{tag}', {})).toThrowError(
      "Missing parameter 'tag' for route '/tags/{tag}' when generating a navigation URL."
    )
  })

  it('replaces named parameter with value from the args object', () => {
    expect(replaceParams('/tags/{tag}', { tag: 'code' })).toEqual('/tags/code')
  })

  it('replaces multiple named parameters with values from the args object', () => {
    expect(
      replaceParams('/posts/{year}/{month}/{day}', {
        year: '2021',
        month: '09',
        day: '19',
      })
    ).toEqual('/posts/2021/09/19')
  })

  it('appends extra parameters as search parameters', () => {
    expect(replaceParams('/extra', { foo: 'foo' })).toEqual('/extra?foo=foo')
    expect(replaceParams('/tags/{tag}', { tag: 'code', foo: 'foo' })).toEqual(
      '/tags/code?foo=foo'
    )
  })

  it('handles falsy parameter values', () => {
    expect(replaceParams('/category/{categoryId}', { categoryId: 0 })).toEqual(
      '/category/0'
    )

    expect(replaceParams('/boolean/{bool}', { bool: false })).toEqual(
      '/boolean/false'
    )

    expect(() =>
      replaceParams('/undef/{undef}', { undef: undefined })
    ).toThrowError(
      "Missing parameter 'undef' for route '/undef/{undef}' when generating a navigation URL."
    )
  })

  it('handles typed params', () => {
    expect(replaceParams('/post/{id:Int}', { id: 7 })).toEqual('/post/7')
    expect(replaceParams('/post/{id:Float}', { id: 7 })).toEqual('/post/7')
    expect(replaceParams('/post/{id:Bool}', { id: true })).toEqual('/post/true')
    expect(replaceParams('/post/{id:Bool}', { id: false })).toEqual(
      '/post/false'
    )
    expect(replaceParams('/post/{id:String}', { id: 7 })).toEqual('/post/7')
  })

  it('handles globs', () => {
    expect(replaceParams('/path/{path...}', { path: 'foo/bar' })).toEqual(
      '/path/foo/bar'
    )

    expect(replaceParams('/a/{b...}/c/{d...}/e', { b: 1, d: 2 })).toEqual(
      '/a/1/c/2/e'
    )
  })
})
