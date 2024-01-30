/* eslint-disable camelcase */

import http from 'node:http'
import { fileURLToPath } from 'node:url'

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { fs, path, $ } from 'zx'

////////////////
// Tests setup
////////////////

const __dirname = fileURLToPath(new URL('./', import.meta.url))
const FIXTURE_PATH = fileURLToPath(
  new URL('./fixtures/redwood-app', import.meta.url)
)
$.verbose = !!process.env.VERBOSE

let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = FIXTURE_PATH
})
afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

// Clean up the child process after each test
let p

afterEach(async () => {
  if (!p) {
    return
  }
  p.kill()
  // Wait for child process to terminate
  try {
    await p
  } catch {
    // Ignore
  }
})

const TIMEOUT = 1_000 * 2

const commandStrings = {
  '@redwoodjs/cli': path.resolve(__dirname, '../../packages/cli/dist/index.js'),
  '@redwoodjs/api-server': path.resolve(
    __dirname,
    '../../packages/api-server/dist/bin.js'
  ),
  '@redwoodjs/web-server': path.resolve(
    __dirname,
    '../../packages/web-server/dist/bin.js'
  ),
}

const redwoodToml = await fs.readFile(
  path.join(__dirname, './fixtures/redwood-app/redwood.toml'),
  'utf-8'
)
const match = redwoodToml.match(/apiUrl = "(?<apiUrl>[^"]*)/)
const apiUrl = match?.groups?.apiUrl
if (!apiUrl) {
  throw new Error("Couldn't find apiUrl in redwood.toml")
}

////////////////
// Tests start
////////////////

// `yarn rw serve` and variants
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
})

// `yarn rw serve api` and variants
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
})

// `yarn rw serve web` and variants
describe.each([
  [[`${commandStrings['@redwoodjs/cli']}`, 'serve', 'web']],
  [[`${commandStrings['@redwoodjs/api-server']}`, 'web']],
  [commandStrings['@redwoodjs/web-server']],
])('serve web (%s)', (commandString) => {
  it('has help configured', async () => {
    const { stdout } = await $`yarn node ${commandString} --help`
    expect(stdout).toMatchSnapshot()
  })

  it("works by default; registers a warning at apiUrl", async () => {
    p = $`yarn node ${commandString}`
    await new Promise((r) => setTimeout(r, TIMEOUT))

    // it serves some page
    const res = await fetch('http://localhost:8910/about')
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      await fs.readFile(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )

    const warningRes = await fetch('http://localhost:8910/.redwood/functions/graphql')
    const warningBody = await warningRes.json()

    expect(warningRes.status).toEqual(200)
    expect(warningBody).toMatchSnapshot()
  })

  it('--api-proxy-target changes the apiUrl proxy target', async () => {
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

  it('--port changes the port', async () => {
    const port = 8912

    p = $`yarn node ${commandString} --apiHost http://localhost:8916 --port ${port}`
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
})

describe('@redwoodjs/cli', () => {
  describe('both server CLI', () => {
    it.todo('handles --socket differently')

    it('has help configured', async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/cli']} serve --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw serve [side]

        Start a server for serving both the api and web sides

        Commands:
          rw serve      Start a server for serving both the api and web sides  [default]
          rw serve api  Start a server for serving only the api side
          rw serve web  Start a server for serving only the web side

        Options:
              --help       Show help                                           [boolean]
              --version    Show version number                                 [boolean]
              --cwd        Working directory to use (where \`redwood.toml\` is located)
              --telemetry  Whether to send anonymous usage telemetry to RedwoodJS
                                                                               [boolean]
          -p, --port       The port to listen at                                [number]
              --host       The host to listen at. Note that you most likely want this to
                           be '0.0.0.0' in production                           [string]

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
          "rw serve [side]

          Start a server for serving both the api and web sides

          Commands:
            rw serve      Start a server for serving both the api and web sides  [default]
            rw serve api  Start a server for serving only the api side
            rw serve web  Start a server for serving only the web side

          Options:
                --help       Show help                                           [boolean]
                --version    Show version number                                 [boolean]
                --cwd        Working directory to use (where \`redwood.toml\` is located)
                --telemetry  Whether to send anonymous usage telemetry to RedwoodJS
                                                                                 [boolean]
            -p, --port       The port to listen at                                [number]
                --host       The host to listen at. Note that you most likely want this to
                             be '0.0.0.0' in production                           [string]

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

        Start a server for serving only the api side

        Options:
              --help                                Show help                  [boolean]
              --version                             Show version number        [boolean]
              --cwd                                 Working directory to use (where
                                                    \`redwood.toml\` is located)
              --telemetry                           Whether to send anonymous usage
                                                    telemetry to RedwoodJS     [boolean]
          -p, --port                                The port to listen at       [number]
              --host                                The host to listen at. Note that you
                                                    most likely want this to be
                                                    '0.0.0.0' in production     [string]
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

          Start a server for serving only the api side

          Options:
                --help                                Show help                  [boolean]
                --version                             Show version number        [boolean]
                --cwd                                 Working directory to use (where
                                                      \`redwood.toml\` is located)
                --telemetry                           Whether to send anonymous usage
                                                      telemetry to RedwoodJS     [boolean]
            -p, --port                                The port to listen at       [number]
                --host                                The host to listen at. Note that you
                                                      most likely want this to be
                                                      '0.0.0.0' in production     [string]
                --apiRootPath, --api-root-path,       Root path where your api functions
                --rootPath, --root-path               are served   [string] [default: "/"]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })
})

describe('@redwoodjs/api-server', () => {
  describe('both server CLI', () => {
    it("doesn't have help configured", async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw-server

        Start a server for serving both the api and web sides

        Commands:
          rw-server      Start a server for serving both the api and web sides [default]
          rw-server api  Start a server for serving only the api side
          rw-server web  Start a server for serving only the web side

        Options:
              --help     Show help                                             [boolean]
              --version  Show version number                                   [boolean]
          -p, --port     The port to listen at                                  [number]
              --host     The host to listen at. Note that you most likely want this to
                         be '0.0.0.0' in production                             [string]
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
          "rw-server

          Start a server for serving both the api and web sides

          Commands:
            rw-server      Start a server for serving both the api and web sides [default]
            rw-server api  Start a server for serving only the api side
            rw-server web  Start a server for serving only the web side

          Options:
                --help     Show help                                             [boolean]
                --version  Show version number                                   [boolean]
            -p, --port     The port to listen at                                  [number]
                --host     The host to listen at. Note that you most likely want this to
                           be '0.0.0.0' in production                             [string]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })

  describe('api server CLI', () => {
    it('has help configured', async () => {
      const { stdout } =
        await $`yarn node ${commandStrings['@redwoodjs/api-server']} api --help`

      expect(stdout).toMatchInlineSnapshot(`
        "rw-server api

        Start a server for serving only the api side

        Options:
              --help                                Show help                  [boolean]
              --version                             Show version number        [boolean]
          -p, --port                                The port to listen at       [number]
              --host                                The host to listen at. Note that you
                                                    most likely want this to be
                                                    '0.0.0.0' in production     [string]
              --apiRootPath, --api-root-path,       Root path where your api functions
              --rootPath, --root-path               are served   [string] [default: "/"]
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

          Start a server for serving only the api side

          Options:
                --help                                Show help                  [boolean]
                --version                             Show version number        [boolean]
            -p, --port                                The port to listen at       [number]
                --host                                The host to listen at. Note that you
                                                      most likely want this to be
                                                      '0.0.0.0' in production     [string]
                --apiRootPath, --api-root-path,       Root path where your api functions
                --rootPath, --root-path               are served   [string] [default: "/"]

          Unknown arguments: foo, bar, baz
          "
        `)
      }
    })
  })
})
