import fs from 'fs'
import path from 'path'

import Fastify from 'fastify'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { getPaths } from '@redwoodjs/project-config'

import { redwoodFastifyWeb, resolveOptions } from './web'

let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = path.join(__dirname, '__fixtures__/main')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

describe('resolveOptions', () => {
  // The possible values we will support for apiUrl and apiProxyTarget are:
  // apiUrl: (aka prefix)
  //  - undefined
  //  - empty
  //  - relative
  //  - fully-qualified
  // apiProxyTarget: (aka upstream)
  //  - undefined
  //  - empty
  //  - relative
  //  - fully-qualified

  describe('undefined apiUrl', () => {
    it.skip('undefined apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: undefined,
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/.redwood/functions']`
      )
    })

    it.skip('empty apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: '',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/.redwood/functions']`
      )
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: undefined,
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "http://api.foo.com",
            "apiUrl": "/.redwood/functions",
          },
        }
      `)
    })
  })

  describe('empty apiUrl', () => {
    it.skip('undefined apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: undefined,
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '']`
      )
    })

    it.skip('empty apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: '',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '']`
      )
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '',
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, \`apiUrl\` has to be a relative URL. \`apiUrl\` is '']`
      )
    })
  })

  describe('relative apiUrl', () => {
    it.skip('undefined apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: undefined,
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/api']`
      )
    })

    it.skip('empty apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: '',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you don't provide \`apiProxyTarget\`, \`apiUrl\` needs to be a fully-qualified URL. \`apiUrl\` is '/api']`
      )
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: '/api',
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "http://api.foo.com",
            "apiUrl": "/api",
          },
        }
      `)
    })
  })

  describe('fully-qualified apiUrl', () => {
    it('undefined apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: undefined,
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": undefined,
            "apiUrl": "http://api.foo.com",
          },
        }
      `)
    })

    it('empty apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: '',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "",
            "apiUrl": "http://api.foo.com",
          },
        }
      `)
    })

    it('relative apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: '/api',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, it has to be a fully-qualified URL. \`apiProxyTarget\` is '/api']`
      )
    })

    it('fully-qualified apiProxyTarget', () => {
      expect(() =>
        resolveOptions({
          redwood: {
            apiUrl: 'http://api.foo.com',
            apiProxyTarget: 'http://api.foo.com',
          },
        })
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: If you provide \`apiProxyTarget\`, \`apiUrl\` cannot be a fully-qualified URL. \`apiUrl\` is 'http://api.foo.com']`
      )
    })
  })

  describe('apiHost', () => {
    it('apiHost is a deprecated alias of apiProxyTarget', () => {
      expect(
        resolveOptions({
          redwood: {
            apiHost: 'http://api.foo.com',
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "redwood": {
            "apiProxyTarget": "http://api.foo.com",
            "apiUrl": "/.redwood/functions",
          },
        }
      `)
    })
  })
})

describe('redwoodFastifyWeb', () => {
  // Suppress terminal logging.
  console.log = vi.fn()

  // Set up and teardown the fastify instance with options.
  let fastifyInstance

  const port = 8910

  beforeAll(async () => {
    fastifyInstance = Fastify()

    await fastifyInstance.register(redwoodFastifyWeb, {
      redwood: {
        apiProxyTarget: 'http://localhost:8911',
      },
    })

    await fastifyInstance.ready()
  })

  afterAll(async () => {
    await fastifyInstance.close()
  })

  // We can use `printRoutes` with a method for debugging, but not without one.
  // See https://fastify.dev/docs/latest/Reference/Server#printroutes
  it('builds a tree of routes for GET', async () => {
    expect(fastifyInstance.printRoutes({ method: 'GET' }))
      .toMatchInlineSnapshot(`
        "└── /
            ├── about (GET)
            ├── contacts/new (GET)
            ├── nested/index (GET)
            ├── .redwood/functions (GET)
            │   └── / (GET)
            │       └── * (GET)
            └── * (GET)
        "
      `)
  })

  describe('serves prerendered files', () => {
    it('serves the prerendered about page', async () => {
      const url = '/about'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, `${url}.html`), 'utf-8')
      )
    })

    it('serves the prerendered new contact page', async () => {
      const url = '/contacts/new'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, `${url}.html`), 'utf-8')
      )
    })

    // We don't serve files named index.js at the root level.
    // This logic ensures nested files aren't affected.
    it('serves the prerendered nested index page', async () => {
      const url = '/nested/index'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, `${url}.html`), 'utf-8')
      )
    })

    it('serves prerendered files with certain headers', async () => {
      await fastifyInstance.listen({ port })

      const res = await fetch(`http://localhost:${port}/about`)
      const headers = [...res.headers.keys()]

      expect(headers).toMatchInlineSnapshot(`
      [
        "accept-ranges",
        "cache-control",
        "connection",
        "content-length",
        "content-type",
        "date",
        "etag",
        "keep-alive",
        "last-modified",
      ]
    `)
    })

    // I'm not sure if this was intentional, but we support it.
    // We may want to use the `@fastify/static` plugin's `allowedPath` option.
    // See https://github.com/fastify/fastify-static?tab=readme-ov-file#allowedpath.
    it('serves prerendered files at `${routeName}.html`', async () => {
      const url = '/about.html'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, url), 'utf-8')
      )
    })

    it('handles not found by serving a fallback', async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/absent.html',
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, '200.html'), 'utf-8')
      )
    })
  })

  describe('serves pretty much anything in web dist', () => {
    it('serves the built AboutPage.js', async () => {
      const relativeFilePath = '/assets/AboutPage-7ec0f8df.js'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url: relativeFilePath,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe(
        'application/javascript; charset=UTF-8'
      )
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, relativeFilePath),
          'utf-8'
        )
      )
    })

    it('serves the built index.css', async () => {
      const relativeFilePath = '/assets/index-613d397d.css'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url: relativeFilePath,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/css; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, relativeFilePath),
          'utf-8'
        )
      )
    })

    it('serves build-manifest.json', async () => {
      const relativeFilePath = '/build-manifest.json'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url: relativeFilePath,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe(
        'application/json; charset=UTF-8'
      )
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, relativeFilePath),
          'utf-8'
        )
      )
    })

    it('serves favicon.png', async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/favicon.png',
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('image/png')
    })

    it('serves README.md', async () => {
      const relativeFilePath = '/README.md'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url: relativeFilePath,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/markdown; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, relativeFilePath),
          'utf-8'
        )
      )
    })

    it('serves robots.txt', async () => {
      const relativeFilePath = '/robots.txt'

      const res = await fastifyInstance.inject({
        method: 'GET',
        url: relativeFilePath,
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/plain; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, relativeFilePath),
          'utf-8'
        )
      )
    })
  })

  describe("returns a 404 for assets that can't be found", () => {
    it("returns a 404 for non-html assets that can't be found", async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/kittens.png',
      })

      expect(res.statusCode).toBe(404)
    })

    it('handles "."s in routes', async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/my-page?loading=spinner.blue',
      })

      expect(res.statusCode).toBe(200)
    })
  })
})
