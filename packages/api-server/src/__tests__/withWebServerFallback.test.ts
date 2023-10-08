import fs from 'fs'
import path from 'path'

import { getPaths } from '@redwoodjs/project-config'

import { createFastifyInstance } from '../fastify'
import withWebServer from '../plugins/withWebServer'

// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD

  process.env.RWJS_CWD = path.join(__dirname, 'fixtures/redwood-app-fallback')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

test("handles not found by serving index.html if 200.html doesn't exist", async () => {
  const fastifyInstance = await withWebServer(
    createFastifyInstance({ logger: false }),
    {
      port: 8910,
    }
  )

  const relativeFilePath = '/index.html'

  const res = await fastifyInstance.inject({
    method: 'GET',
    url: relativeFilePath,
  })

  expect(res.statusCode).toBe(200)
  expect(res.headers['content-type']).toBe('text/html; charset=UTF-8')
  expect(res.body).toBe(
    fs.readFileSync(path.join(getPaths().web.dist, relativeFilePath), 'utf-8')
  )

  await fastifyInstance.close()
})
