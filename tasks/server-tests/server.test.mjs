/* eslint-disable camelcase */

import http from 'node:http'
import { fileURLToPath } from 'node:url'

import { fs, path, $ } from 'zx'

const __dirname = fileURLToPath(new URL('./', import.meta.url))

const FIXTURE_PATH = fileURLToPath(
  new URL('./fixtures/redwood-app', import.meta.url)
)

////////////////////////////////////////////////////////////////
// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

////////////////////////////////////////////////////////////////
// Clean up the child process after each test.
let p

afterEach(async () => {
  if (!p) {
    return
  }

  p.kill()

  // Wait for child process to terminate.
  try {
    await p
  } catch (e) {
    // Ignore the error.
  }
})

const TIMEOUT = 1_000 * 2

const commandStrings = {
  '@redwoodjs/cli': path.resolve(__dirname, '../../packages/cli/dist/index.js'),
  '@redwoodjs/api-server': path.resolve(
    __dirname,
    '../../packages/api-server/dist/index.js'
  ),
  '@redwoodjs/web-server': path.resolve(
    __dirname,
    '../../packages/web-server/dist/server.js'
  ),
}

const redwoodToml = fs.readFileSync(
  path.join(__dirname, './fixtures/redwood-app/redwood.toml'),
  'utf-8'
)

const {
  groups: { apiUrl },
} = redwoodToml.match(/apiUrl = "(?<apiUrl>[^"]*)/)

describe.each([
  [[commandStrings['@redwoodjs/cli'], 'serve']],
  [commandStrings['@redwoodjs/api-server']],
])('serve both (%s)', (commandString) => {
  it('serves both sides, using the apiRootPath in redwood.toml', async () => {
    p = $`yarn node ${commandString}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const webRes = await fetch('http://localhost:8910/about')
    const webBody = await webRes.text()

    expect(webRes.status).toEqual(200)
    expect(webBody).toEqual(
      fs.readFileSync(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )

    const apiRes = await fetch(`http://localhost:8910${apiUrl}/hello`)
    const apiBody = await apiRes.json()

    expect(apiRes.status).toEqual(200)
    expect(apiBody).toEqual({ data: 'hello function' })
  })

  it('--port changes the port', async () => {
    const port = 8920

    p = $`yarn node ${commandString} --port ${port}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const webRes = await fetch(`http://localhost:${port}/about`)
    const webBody = await webRes.text()

    expect(webRes.status).toEqual(200)
    expect(webBody).toEqual(
      fs.readFileSync(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )

    const apiRes = await fetch(`http://localhost:${port}${apiUrl}/hello`)
    const apiBody = await apiRes.json()

    expect(apiRes.status).toEqual(200)
    expect(apiBody).toEqual({ data: 'hello function' })
  })

  it.todo('changing redwood.toml api.port does nothing')
  it.todo('changing redwood.toml web.port works')
})

describe.each([
  [[commandStrings['@redwoodjs/cli'], 'serve', 'api']],
  [[commandStrings['@redwoodjs/api-server'], 'api']],
])('serve api (%s)', (commandString) => {
  it('serves the api side', async () => {
    p = $`yarn node ${commandString}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8911/hello')
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: 'hello function' })
  })

  it('--port changes the port', async () => {
    const port = 3000

    p = $`yarn node ${commandString} --port ${port}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch(`http://localhost:${port}/hello`)
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: 'hello function' })
  })

  it('--apiRootPath changes the prefix', async () => {
    const apiRootPath = '/api'

    p = $`yarn node ${commandString} --apiRootPath ${apiRootPath}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch(`http://localhost:8911${apiRootPath}/hello`)
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: 'hello function' })
  })

  it.todo('changing redwood.toml api.port works')
  it.todo('changing redwood.toml web.apiUrl does nothing?')
})

// We can't test @redwoodjs/cli here because it depends on node_modules.
describe.each([
  [[`${commandStrings['@redwoodjs/api-server']}`, 'web']],
  [commandStrings['@redwoodjs/web-server']],
])('serve web (%s)', (commandString) => {
  it('serves the web side', async () => {
    p = $`yarn node ${commandString}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8910/about')
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      await fs.readFile(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )
  })

  it('--port changes the port', async () => {
    const port = 8912

    p = $`yarn node ${commandString} --port ${port}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch(`http://localhost:${port}/about`)
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      await fs.readFile(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )
  })

  it('--apiHost changes the upstream api url', async () => {
    const apiPort = 8916
    const apiHost = 'localhost'

    const helloData = { data: 'hello from mock server' }

    const server = http.createServer((req, res) => {
      if (req.url === '/hello') {
        res.end(JSON.stringify(helloData))
      }
    })

    server.listen(apiPort, apiHost)

    p = $`yarn node ${commandString} --apiHost http://${apiHost}:${apiPort}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8910/.redwood/functions/hello')
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual(helloData)

    server.close()
  })

  it('errors out on unknown args', async () => {
    try {
      await $`yarn node ${commandString} --foo --bar --baz`
      expect(true).toEqual(false)
    } catch (p) {
      expect(p.exitCode).toEqual(1)
      expect(p.stdout).toEqual('')
      expect(p.stderr).toMatchSnapshot()
    }
  })

  it.todo('changing redwood.toml web.port works')
  it.todo("if apiHost isn't set, and apiUrl isn't fully qualified, exits")
  it.todo(
    "if api host isn't set, and api url is fully qualified, hits upstream"
  )
  it.todo(
    'if api host is set, and api url is fully qualified, also breaks cause it tries to proxy?'
  )
})

describe('@redwoodjs/cli', () => {
  describe('both server CLI', () => {
    it.todo('handles --socket differently')

    it('has help configured', async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve --help`

      expect(stdout).toMatchInlineSnapshot(`
        "usage: rw <side>

        Commands:
          rw serve      Run both api and web servers                           [default]
          rw serve api  Start server for serving only the api
          rw serve web  Start server for serving only the web side

        Options:
              --help       Show help                                           [boolean]
              --version    Show version number                                 [boolean]
              --cwd        Working directory to use (where \`redwood.toml\` is located)
              --telemetry  Whether to send anonymous usage telemetry to RedwoodJS
                                                                               [boolean]
          -p, --port                                            [number] [default: 8910]
              --socket                                                          [string]

        Also see the Redwood CLI Reference
        (​https://redwoodjs.com/docs/cli-commands#serve​)
        "
      `)
    })

    it('errors out on unknown args', async () => {
      try {
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve --foo --bar --baz`
        expect(true).toEqual(false)
      } catch (p) {
        expect(p.exitCode).toEqual(1)
        expect(p.stdout).toEqual('')
        expect(p.stderr).toMatchInlineSnapshot(`
          "usage: rw <side>

          Commands:
            rw serve      Run both api and web servers                           [default]
            rw serve api  Start server for serving only the api
            rw serve web  Start server for serving only the web side

          Options:
                --help       Show help                                           [boolean]
                --version    Show version number                                 [boolean]
                --cwd        Working directory to use (where \`redwood.toml\` is located)
                --telemetry  Whether to send anonymous usage telemetry to RedwoodJS
                                                                                 [boolean]
            -p, --port                                            [number] [default: 8910]
                --socket                                                          [string]

          Also see the Redwood CLI Reference
          (​https://redwoodjs.com/docs/cli-commands#serve​)

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })

  describe('api server CLI', () => {
    it.todo('handles --socket differently')

    it('loads dotenv files', async () => {
      p = $`yarn node ${commandStrings['@redwoodjs/cli']} serve api`

      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:8911/env`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: '42' })
    })

    it('has help configured', async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve api --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw serve api

        Start server for serving only the api

        Options:
              --help                                Show help                  [boolean]
              --version                             Show version number        [boolean]
              --cwd                                 Working directory to use (where
                                                    \`redwood.toml\` is located)
              --telemetry                           Whether to send anonymous usage
                                                    telemetry to RedwoodJS     [boolean]
          -p, --port                                            [number] [default: 8911]
              --socket                                                          [string]
              --apiRootPath, --api-root-path,       Root path where your api functions
              --rootPath, --root-path               are served   [string] [default: "/"]
        "
      `)
    })

    it('errors out on unknown args', async () => {
      try {
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve api --foo --bar --baz`
        expect(true).toEqual(false)
      } catch (p) {
        expect(p.exitCode).toEqual(1)
        expect(p.stdout).toEqual('')
        expect(p.stderr).toMatchInlineSnapshot(`
          "rw serve api

          Start server for serving only the api

          Options:
                --help                                Show help                  [boolean]
                --version                             Show version number        [boolean]
                --cwd                                 Working directory to use (where
                                                      \`redwood.toml\` is located)
                --telemetry                           Whether to send anonymous usage
                                                      telemetry to RedwoodJS     [boolean]
            -p, --port                                            [number] [default: 8911]
                --socket                                                          [string]
                --apiRootPath, --api-root-path,       Root path where your api functions
                --rootPath, --root-path               are served   [string] [default: "/"]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })

  describe('web server CLI', () => {
    it.todo('handles --socket differently')

    it('has help configured', async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve web --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw serve web

        Start server for serving only the web side

        Options:
              --help                 Show help                                 [boolean]
              --version              Show version number                       [boolean]
              --cwd                  Working directory to use (where \`redwood.toml\` is
                                     located)
              --telemetry            Whether to send anonymous usage telemetry to
                                     RedwoodJS                                 [boolean]
          -p, --port                                            [number] [default: 8910]
              --socket                                                          [string]
              --apiHost, --api-host  Forward requests from the apiUrl, defined in
                                     redwood.toml to this host                  [string]
        "
      `)
    })

    it('errors out on unknown args', async () => {
      try {
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve web  --foo --bar --baz`
        expect(true).toEqual(false)
      } catch (p) {
        expect(p.exitCode).toEqual(1)
        expect(p.stdout).toEqual('')
        expect(p.stderr).toMatchInlineSnapshot(`
          "rw serve web

          Start server for serving only the web side

          Options:
                --help                 Show help                                 [boolean]
                --version              Show version number                       [boolean]
                --cwd                  Working directory to use (where \`redwood.toml\` is
                                       located)
                --telemetry            Whether to send anonymous usage telemetry to
                                       RedwoodJS                                 [boolean]
            -p, --port                                            [number] [default: 8910]
                --socket                                                          [string]
                --apiHost, --api-host  Forward requests from the apiUrl, defined in
                                       redwood.toml to this host                  [string]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })
})

describe('@redwoodjs/api-server', () => {
  describe('both server CLI', () => {
    it('--socket changes the port', async () => {
      const socket = 8921

      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} --socket ${socket}`
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const webRes = await fetch(`http://localhost:${socket}/about`)
      const webBody = await webRes.text()

      expect(webRes.status).toEqual(200)
      expect(webBody).toEqual(
        fs.readFileSync(
          path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
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

      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} --socket ${socket} --port ${port}`
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const webRes = await fetch(`http://localhost:${socket}/about`)
      const webBody = await webRes.text()

      expect(webRes.status).toEqual(200)
      expect(webBody).toEqual(
        fs.readFileSync(
          path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
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

    it("doesn't have help configured", async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} --help`

      expect(stdout).toMatchInlineSnapshot(`
        "usage: rw-server <side>

        Commands:
          rw-server      Run both api and web servers                          [default]
          rw-server api  Start server for serving only the api
          rw-server web  Start server for serving only the web side

        Options:
              --help     Show help                                             [boolean]
              --version  Show version number                                   [boolean]
          -p, --port                                            [number] [default: 8910]
              --socket                                                          [string]
        "
      `)
    })

    it('errors out on unknown args', async () => {
      try {
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} --foo --bar --baz`
        expect(true).toEqual(false)
      } catch (p) {
        expect(p.exitCode).toEqual(1)
        expect(p.stdout).toEqual('')
        expect(p.stderr).toMatchInlineSnapshot(`
          "usage: rw-server <side>

          Commands:
            rw-server      Run both api and web servers                          [default]
            rw-server api  Start server for serving only the api
            rw-server web  Start server for serving only the web side

          Options:
                --help     Show help                                             [boolean]
                --version  Show version number                                   [boolean]
            -p, --port                                            [number] [default: 8910]
                --socket                                                          [string]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })

  describe('api server CLI', () => {
    it('--socket changes the port', async () => {
      const socket = 3001

      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} api --socket ${socket}`
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:${socket}/hello`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: 'hello function' })
    })

    it('--socket wins out over --port', async () => {
      const socket = 3002
      const port = 3003

      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} api  --socket ${socket} --port ${port}`
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:${socket}/hello`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: 'hello function' })
    })

    it('--loadEnvFiles loads dotenv files', async () => {
      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} api --loadEnvFiles`
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:8911/env`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: '42' })
    })

    it('has help configured', async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} api --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw-server api

        Start server for serving only the api

        Options:
              --help                                Show help                  [boolean]
              --version                             Show version number        [boolean]
          -p, --port                                            [number] [default: 8911]
              --socket                                                          [string]
              --apiRootPath, --api-root-path,       Root path where your api functions
              --rootPath, --root-path               are served   [string] [default: "/"]
              --loadEnvFiles                        Load .env and .env.defaults files
                                                              [boolean] [default: false]
        "
      `)
    })

    it('errors out on unknown args', async () => {
      try {
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} api  --foo --bar --baz`
        expect(true).toEqual(false)
      } catch (p) {
        expect(p.exitCode).toEqual(1)
        expect(p.stdout).toEqual('')
        expect(p.stderr).toMatchInlineSnapshot(`
          "rw-server api

          Start server for serving only the api

          Options:
                --help                                Show help                  [boolean]
                --version                             Show version number        [boolean]
            -p, --port                                            [number] [default: 8911]
                --socket                                                          [string]
                --apiRootPath, --api-root-path,       Root path where your api functions
                --rootPath, --root-path               are served   [string] [default: "/"]
                --loadEnvFiles                        Load .env and .env.defaults files
                                                                [boolean] [default: false]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })

  describe('web server CLI', () => {
    it('--socket changes the port', async () => {
      const socket = 8913

      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} web --socket ${socket}`

      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:${socket}/about`)
      const body = await res.text()

      expect(res.status).toEqual(200)
      expect(body).toEqual(
        fs.readFileSync(
          path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
          'utf-8'
        )
      )
    })

    it('--socket wins out over --port', async () => {
      const socket = 8914
      const port = 8915

      p = $`yarn node ${commandStrings['@redwoodjs/api-server']} web --socket ${socket} --port ${port}`
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:${socket}/about`)
      const body = await res.text()

      expect(res.status).toEqual(200)
      expect(body).toEqual(
        fs.readFileSync(
          path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
          'utf-8'
        )
      )
    })

    it("doesn't have help configured", async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} web --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw-server web

        Start server for serving only the web side

        Options:
              --help                 Show help                                 [boolean]
              --version              Show version number                       [boolean]
          -p, --port                                            [number] [default: 8910]
              --socket                                                          [string]
              --apiHost, --api-host  Forward requests from the apiUrl, defined in
                                     redwood.toml to this host                  [string]
        "
      `)
    })

    it('errors out on unknown args', async () => {
      try {
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} web --foo --bar --baz`
        expect(true).toEqual(false)
      } catch (p) {
        expect(p.exitCode).toEqual(1)
        expect(p.stdout).toEqual('')
        expect(p.stderr).toMatchInlineSnapshot(`
          "rw-server web

          Start server for serving only the web side

          Options:
                --help                 Show help                                 [boolean]
                --version              Show version number                       [boolean]
            -p, --port                                            [number] [default: 8910]
                --socket                                                          [string]
                --apiHost, --api-host  Forward requests from the apiUrl, defined in
                                       redwood.toml to this host                  [string]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })
})

describe('@redwoodjs/web-server', () => {
  it.todo('handles --socket differently')

  it('has help configured', async () => {
    const { stdout } =
      await $`yarn node ${commandStrings['@redwoodjs/web-server']} --help`

    expect(stdout).toMatchInlineSnapshot(`
      "rw-web-server

      Start server for serving only the web side

      Options:
            --help                 Show help                                 [boolean]
            --version              Show version number                       [boolean]
        -p, --port                                            [number] [default: 8910]
            --socket                                                          [string]
            --apiHost, --api-host  Forward requests from the apiUrl, defined in
                                   redwood.toml to this host                  [string]
      "
    `)
  })
})
