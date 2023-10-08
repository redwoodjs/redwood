import fs from 'fs'
import http from 'http'
import path from 'path'

import execa from 'execa'

const distPath = path.join(__dirname, 'dist')
const packageConfig = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

describe('dist', () => {
  it("shouldn't have the __tests__ directory", () => {
    expect(fs.existsSync(path.join(distPath, '__tests__'))).toBe(false)
  })

  // The way this package was written, you can't just import it.
  // It expects to be in a Redwood project.
  it('fails if imported outside a Redwood app', async () => {
    try {
      await import(path.join(distPath, 'cliHandlers.js'))
    } catch (e) {
      expect(e.message).toMatchInlineSnapshot(
        `"Could not find a "redwood.toml" file, are you sure you're in a Redwood project?"`
      )
    }
  })

  it('exports CLI options and handlers', async () => {
    const original_RWJS_CWD = process.env.RWJS_CWD

    process.env.RWJS_CWD = path.join(
      __dirname,
      'src/__tests__/fixtures/redwood-app'
    )

    const mod = await import(
      path.resolve(distPath, packageConfig.main.replace('dist/', ''))
    )

    expect(mod).toMatchInlineSnapshot(`
      {
        "apiCliOptions": {
          "apiRootPath": {
            "alias": [
              "rootPath",
              "root-path",
            ],
            "coerce": [Function],
            "default": "/",
            "desc": "Root path where your api functions are served",
            "type": "string",
          },
          "loadEnvFiles": {
            "default": false,
            "description": "Load .env and .env.defaults files",
            "type": "boolean",
          },
          "port": {
            "alias": "p",
            "default": 8911,
            "type": "number",
          },
          "socket": {
            "type": "string",
          },
        },
        "apiServerHandler": [Function],
        "bothServerHandler": [Function],
        "commonOptions": {
          "port": {
            "alias": "p",
            "default": 8910,
            "type": "number",
          },
          "socket": {
            "type": "string",
          },
        },
        "webCliOptions": {
          "apiHost": {
            "alias": "api-host",
            "desc": "Forward requests from the apiUrl, defined in redwood.toml to this host",
            "type": "string",
          },
          "port": {
            "alias": "p",
            "default": 8910,
            "type": "number",
          },
          "socket": {
            "type": "string",
          },
        },
        "webServerHandler": [Function],
      }
    `)

    process.env.RWJS_CWD = original_RWJS_CWD
  })

  it('ships three bins', () => {
    expect(packageConfig.bin).toMatchInlineSnapshot(`
      {
        "rw-api-server-watch": "./dist/watch.js",
        "rw-log-formatter": "./dist/logFormatter/bin.js",
        "rw-server": "./dist/index.js",
      }
    `)
  })

  describe('cliHandlers', () => {
    // Set up RWJS_CWD.
    let original_RWJS_CWD

    beforeAll(() => {
      original_RWJS_CWD = process.env.RWJS_CWD

      process.env.RWJS_CWD = path.join(
        __dirname,
        'src/__tests__/fixtures/redwood-app'
      )
    })

    afterAll(() => {
      process.env.RWJS_CWD = original_RWJS_CWD
    })

    // Clean up the child process after each test.
    let child

    afterEach(async () => {
      if (!child) {
        return
      }

      child.cancel()

      // Wait for child process to terminate.
      try {
        await child
      } catch (e) {
        // Ignore the error.
      }
    })

    const commandString = `node ${path.join(__dirname, 'dist', 'index.js')}`
    const TIMEOUT = 1_000

    describe('both server CLI', () => {
      it('serves both sides, using the apiRootPath in redwood.toml', async () => {
        child = execa.command(`${commandString}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const webRes = await fetch('http://localhost:8910/about')
        const webBody = await webRes.text()

        expect(webRes.status).toEqual(200)
        expect(webBody).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )

        const redwoodToml = fs.readFileSync(
          path.join(
            __dirname,
            'src/__tests__/fixtures/redwood-app/redwood.toml'
          ),
          'utf-8'
        )

        const {
          groups: { apiUrl },
        } = redwoodToml.match(/apiUrl = "(?<apiUrl>[^"]*)/)

        const apiRes = await fetch(`http://localhost:8910${apiUrl}/hello`)
        const apiBody = await apiRes.json()

        expect(apiRes.status).toEqual(200)
        expect(apiBody).toEqual({ data: 'hello function' })
      })

      it('--port changes the port', async () => {
        const port = 8920

        child = execa.command(`${commandString} --port ${port}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const webRes = await fetch(`http://localhost:${port}/about`)
        const webBody = await webRes.text()

        expect(webRes.status).toEqual(200)
        expect(webBody).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )

        const apiRes = await fetch(
          `http://localhost:${port}/.redwood/functions/hello`
        )
        const apiBody = await apiRes.json()

        expect(apiRes.status).toEqual(200)
        expect(apiBody).toEqual({ data: 'hello function' })
      })

      it('--socket changes the port', async () => {
        const socket = 8921

        child = execa.command(`${commandString} --socket ${socket}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const webRes = await fetch(`http://localhost:${socket}/about`)
        const webBody = await webRes.text()

        expect(webRes.status).toEqual(200)
        expect(webBody).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )

        const apiRes = await fetch(
          `http://localhost:${socket}/.redwood/functions/hello`
        )
        const apiBody = await apiRes.json()

        expect(apiRes.status).toEqual(200)
        expect(apiBody).toEqual({ data: 'hello function' })
      })

      it('--socket wins out over --port', async () => {
        const socket = 8922
        const port = 8923

        child = execa.command(
          `${commandString} --socket ${socket} --port ${port}`
        )
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const webRes = await fetch(`http://localhost:${socket}/about`)
        const webBody = await webRes.text()

        expect(webRes.status).toEqual(200)
        expect(webBody).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )

        const apiRes = await fetch(
          `http://localhost:${socket}/.redwood/functions/hello`
        )
        const apiBody = await apiRes.json()

        expect(apiRes.status).toEqual(200)
        expect(apiBody).toEqual({ data: 'hello function' })
      })

      it("doesn't have help configured", () => {
        const { stdout } = execa.commandSync(`${commandString} --help`)

        expect(stdout).toMatchInlineSnapshot(`
        "Options:
          --help     Show help                                                 [boolean]
          --version  Show version number                                       [boolean]"
      `)
      })

      it("doesn't error out on unknown args", async () => {
        child = execa.command(`${commandString} --foo --bar --baz`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const webRes = await fetch('http://localhost:8910/about')
        const webBody = await webRes.text()

        expect(webRes.status).toEqual(200)
        expect(webBody).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )

        const apiRes = await fetch(
          'http://localhost:8910/.redwood/functions/hello'
        )
        const apiBody = await apiRes.json()

        expect(apiRes.status).toEqual(200)
        expect(apiBody).toEqual({ data: 'hello function' })
      })
    })

    describe('api server CLI', () => {
      it('serves the api side', async () => {
        child = execa.command(`${commandString} api`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch('http://localhost:8911/hello')
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: 'hello function' })
      })

      it('--port changes the port', async () => {
        const port = 3000

        child = execa.command(`${commandString} api --port ${port}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:${port}/hello`)
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: 'hello function' })
      })

      it('--socket changes the port', async () => {
        const socket = 3001

        child = execa.command(`${commandString} api --socket ${socket}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:${socket}/hello`)
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: 'hello function' })
      })

      it('--socket wins out over --port', async () => {
        const socket = 3002
        const port = 3003

        child = execa.command(
          `${commandString} api --socket ${socket} --port ${port}`
        )
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:${socket}/hello`)
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: 'hello function' })
      })

      it('--apiRootPath changes the prefix', async () => {
        const apiRootPath = '/api'

        child = execa.command(
          `${commandString} api --apiRootPath ${apiRootPath}`
        )
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:8911/api/hello`)
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: 'hello function' })
      })

      it('--loadEnvFiles loads dotenv files', async () => {
        child = execa.command(`${commandString} api --loadEnvFiles`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:8911/env`)
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: '42' })
      })

      it("doesn't have help configured", () => {
        const { stdout } = execa.commandSync(`${commandString} api --help`)

        expect(stdout).toMatchInlineSnapshot(`
        "Options:
          --help     Show help                                                 [boolean]
          --version  Show version number                                       [boolean]"
      `)
      })

      it("doesn't error out on unknown args", async () => {
        child = execa.command(`${commandString} api --foo --bar --baz`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch('http://localhost:8911/hello')
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual({ data: 'hello function' })
      })
    })

    describe('web server CLI', () => {
      it('serves the web side', async () => {
        child = execa.command(`${commandString} web`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch('http://localhost:8910/about')
        const body = await res.text()

        expect(res.status).toEqual(200)
        expect(body).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )
      })

      it('--port changes the port', async () => {
        const port = 8912

        child = execa.command(`${commandString} web --port ${port}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:${port}/about`)
        const body = await res.text()

        expect(res.status).toEqual(200)
        expect(body).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )
      })

      it('--socket changes the port', async () => {
        const socket = 8913

        child = execa.command(`${commandString} web --socket ${socket}`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:${socket}/about`)
        const body = await res.text()

        expect(res.status).toEqual(200)
        expect(body).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )
      })

      it('--socket wins out over --port', async () => {
        const socket = 8914
        const port = 8915

        child = execa.command(
          `${commandString} web --socket ${socket} --port ${port}`
        )
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(`http://localhost:${socket}/about`)
        const body = await res.text()

        expect(res.status).toEqual(200)
        expect(body).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )
      })

      it('--apiHost changes the upstream api url', async () => {
        const apiPort = 8916
        const apiHost = 'localhost'

        const helloData = { data: 'hello' }

        const server = http.createServer((req, res) => {
          if (req.url === '/hello') {
            res.end(JSON.stringify(helloData))
          }
        })

        server.listen(apiPort, apiHost)

        child = execa.command(
          `${commandString} web --apiHost http://${apiHost}:${apiPort}`
        )
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch(
          'http://localhost:8910/.redwood/functions/hello'
        )
        const body = await res.json()

        expect(res.status).toEqual(200)
        expect(body).toEqual(helloData)

        server.close()
      })

      it("doesn't have help configured", () => {
        const { stdout } = execa.commandSync(`${commandString} web --help`)

        expect(stdout).toMatchInlineSnapshot(`
        "Options:
          --help     Show help                                                 [boolean]
          --version  Show version number                                       [boolean]"
      `)
      })

      it("doesn't error out on unknown args", async () => {
        child = execa.command(`${commandString} web --foo --bar --baz`)
        await new Promise((r) => setTimeout(r, TIMEOUT))

        const res = await fetch('http://localhost:8910/about')
        const body = await res.text()

        expect(res.status).toEqual(200)
        expect(body).toEqual(
          fs.readFileSync(
            path.join(
              __dirname,
              'src/__tests__/fixtures/redwood-app/web/dist/about.html'
            ),
            'utf-8'
          )
        )
      })
    })
  })
})
