import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/project-config'

import { createFastifyInstance } from '../fastify'
import withWebServer from '../plugins/withWebServer'

// Suppress terminal logging.
console.log = jest.fn()

// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD

  process.env.RWJS_CWD = path.join(__dirname, 'fixtures/redwood-app')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Set up and teardown the Fastify instance.
let fastifyInstance
let returnedFastifyInstance

const port = 8910
const message = 'hello from server.config.js'

beforeAll(async () => {
  fastifyInstance = createFastifyInstance()

  returnedFastifyInstance = await withWebServer(fastifyInstance, {
    port,
    // @ts-expect-error just testing that options can be passed through
    message,
  })

  await fastifyInstance.ready()
})

afterAll(async () => {
  await fastifyInstance.close()
})

describe('withWebServer', () => {
  it('returns the same fastify instance', async () => {
    expect(returnedFastifyInstance).toBe(fastifyInstance)
  })

  it('can be configured by the user', async () => {
    const res = await fastifyInstance.inject({
      method: 'GET',
      url: '/test-route',
    })

    expect(res.body).toBe(JSON.stringify({ message }))
  })

  it('builds a tree of routes for GET', async () => {
    // We can use printRoutes with a method for debugging.
    // See https://fastify.dev/docs/latest/Reference/Server#printroutes
    expect(fastifyInstance.printRoutes({ method: 'GET' }))
      .toMatchInlineSnapshot(`
      "└── /
          ├── about (GET)
          ├── contacts/new (GET)
          ├── nested/index (GET)
          ├── test-route (GET)
          └── * (GET)
      "
    `)
  })

  describe('serves prerendered files', () => {
    it('serves the prerendered about page', async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/about',
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, 'about.html'), 'utf-8')
      )
    })

    it('serves the prerendered new contact page', async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/contacts/new',
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, 'contacts/new.html'),
          'utf-8'
        )
      )
    })

    // We don't serve files named index.js at the root level.
    // This logic ensures nested files aren't affected.
    it('serves the prerendered nested index page', async () => {
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/nested/index',
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(
          path.join(getPaths().web.dist, 'nested/index.html'),
          'utf-8'
        )
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
      const res = await fastifyInstance.inject({
        method: 'GET',
        url: '/about.html',
      })

      expect(res.statusCode).toBe(200)
      expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
      expect(res.body).toBe(
        fs.readFileSync(path.join(getPaths().web.dist, 'about.html'), 'utf-8')
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
})
