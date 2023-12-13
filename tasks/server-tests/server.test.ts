const fs = require('fs')
const http = require('http')
const path = require('path')

const execa = require('execa')

// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD
  process.env.RWJS_CWD = path.join(__dirname, './fixtures/redwood-app')
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

const TIMEOUT = 1_000 * 2

const commandStrings = {
  '@redwoodjs/cli': `node ${path.resolve(
    __dirname,
    '../../packages/cli/dist/index.js'
  )} serve`,
  '@redwoodjs/api-server': `node ${path.resolve(
    __dirname,
    '../../packages/api-server/dist/index.js'
  )}`,
  '@redwoodjs/web-server': `node ${path.resolve(
    __dirname,
    '../../packages/web-server/dist/server.js'
  )}`,
}

const redwoodToml = fs.readFileSync(
  path.join(__dirname, './fixtures/redwood-app/redwood.toml'),
  'utf-8'
)

const {
  groups: { apiUrl },
} = redwoodToml.match(/apiUrl = "(?<apiUrl>[^"]*)/)

describe.each([
  [`${commandStrings['@redwoodjs/cli']}`],
  [`${commandStrings['@redwoodjs/api-server']}`],
])('serve both (%s)', (commandString) => {
  it('serves both sides, using the apiRootPath in redwood.toml', async () => {
    child = execa.command(commandString)
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

    child = execa.command(`${commandString} --port ${port}`)
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

describe.each([
  [`${commandStrings['@redwoodjs/cli']} api`],
  [`${commandStrings['@redwoodjs/api-server']} api`],
])('serve api (%s)', (commandString) => {
  it('serves the api side', async () => {
    child = execa.command(commandString)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8911/hello')
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: 'hello function' })
  })

  it('--port changes the port', async () => {
    const port = 3000

    child = execa.command(`${commandString} --port ${port}`)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch(`http://localhost:${port}/hello`)
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: 'hello function' })
  })

  it('--apiRootPath changes the prefix', async () => {
    const apiRootPath = '/api'

    child = execa.command(`${commandString} --apiRootPath ${apiRootPath}`)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch(`http://localhost:8911${apiRootPath}/hello`)
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual({ data: 'hello function' })
  })
})

// We can't test @redwoodjs/cli here because it depends on node_modules.
describe.each([
  [`${commandStrings['@redwoodjs/api-server']} web`],
  [commandStrings['@redwoodjs/web-server']],
])('serve web (%s)', (commandString) => {
  it('serves the web side', async () => {
    child = execa.command(commandString)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8910/about')
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      fs.readFileSync(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )
  })

  it('--port changes the port', async () => {
    const port = 8912

    child = execa.command(`${commandString} --port ${port}`)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch(`http://localhost:${port}/about`)
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      fs.readFileSync(
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

    child = execa.command(
      `${commandString} --apiHost http://${apiHost}:${apiPort}`
    )
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8910/.redwood/functions/hello')
    const body = await res.json()

    expect(res.status).toEqual(200)
    expect(body).toEqual(helloData)

    server.close()
  })

  it("doesn't error out on unknown args", async () => {
    child = execa.command(`${commandString} --foo --bar --baz`)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8910/about')
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      fs.readFileSync(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )
  })
})

describe('@redwoodjs/cli', () => {
  describe('both server CLI', () => {
    const commandString = commandStrings['@redwoodjs/cli']

    it.todo('handles --socket differently')

    it('has help configured', () => {
      const { stdout } = execa.commandSync(`${commandString} --help`)

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
        (​https://redwoodjs.com/docs/cli-commands#serve​)"
      `)
    })

    it('errors out on unknown args', async () => {
      const { stdout } = execa.commandSync(`${commandString} --foo --bar --baz`)

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

        Unknown arguments: foo, bar, baz"
      `)
    })
  })

  describe('api server CLI', () => {
    const commandString = `${commandStrings['@redwoodjs/cli']} api`

    it.todo('handles --socket differently')

    it('loads dotenv files', async () => {
      child = execa.command(`${commandString}`)
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:8911/env`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: '42' })
    })

    it('has help configured', () => {
      const { stdout } = execa.commandSync(`${commandString} --help`)

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
              --rootPath, --root-path               are served   [string] [default: "/"]"
      `)
    })

    it('errors out on unknown args', async () => {
      const { stdout } = execa.commandSync(`${commandString} --foo --bar --baz`)

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

        Unknown arguments: foo, bar, baz"
      `)
    })
  })

  describe('web server CLI', () => {
    const commandString = `${commandStrings['@redwoodjs/cli']} web`

    it.todo('handles --socket differently')

    it('has help configured', () => {
      const { stdout } = execa.commandSync(`${commandString} --help`)

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
                                     redwood.toml to this host                  [string]"
      `)
    })

    it('errors out on unknown args', async () => {
      const { stdout } = execa.commandSync(`${commandString} --foo --bar --baz`)

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

        Unknown arguments: foo, bar, baz"
      `)
    })
  })
})

describe('@redwoodjs/api-server', () => {
  describe('both server CLI', () => {
    const commandString = commandStrings['@redwoodjs/api-server']

    it('--socket changes the port', async () => {
      const socket = 8921

      child = execa.command(`${commandString} --socket ${socket}`)
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

      child = execa.command(
        `${commandString} --socket ${socket} --port ${port}`
      )
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
          path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
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
    const commandString = `${commandStrings['@redwoodjs/api-server']} api`

    it('--socket changes the port', async () => {
      const socket = 3001

      child = execa.command(`${commandString} --socket ${socket}`)
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
        `${commandString} --socket ${socket} --port ${port}`
      )
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:${socket}/hello`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: 'hello function' })
    })

    it('--loadEnvFiles loads dotenv files', async () => {
      child = execa.command(`${commandString} --loadEnvFiles`)
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch(`http://localhost:8911/env`)
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: '42' })
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

      const res = await fetch('http://localhost:8911/hello')
      const body = await res.json()

      expect(res.status).toEqual(200)
      expect(body).toEqual({ data: 'hello function' })
    })
  })

  describe('web server CLI', () => {
    const commandString = `${commandStrings['@redwoodjs/api-server']} web`

    it('--socket changes the port', async () => {
      const socket = 8913

      child = execa.command(`${commandString} --socket ${socket}`)
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

      child = execa.command(
        `${commandString} --socket ${socket} --port ${port}`
      )
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

    it("doesn't have help configured", () => {
      const { stdout } = execa.commandSync(`${commandString} --help`)

      expect(stdout).toMatchInlineSnapshot(`
        "Options:
          --help     Show help                                                 [boolean]
          --version  Show version number                                       [boolean]"
      `)
    })

    it("doesn't error out on unknown args", async () => {
      child = execa.command(`${commandString} --foo --bar --baz`, {
        stdio: 'inherit',
      })
      await new Promise((r) => setTimeout(r, TIMEOUT))

      const res = await fetch('http://localhost:8910/about')
      const body = await res.text()

      expect(res.status).toEqual(200)
      expect(body).toEqual(
        fs.readFileSync(
          path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
          'utf-8'
        )
      )
    })
  })
})

describe('@redwoodjs/web-server', () => {
  const commandString = commandStrings['@redwoodjs/web-server']

  it.todo('handles --socket differently')

  // @redwoodjs/web-server doesn't have help configured in a different way than the others.
  // The others output help, it's just empty. This doesn't even do that. It just runs.
  it("doesn't have help configured", async () => {
    child = execa.command(`${commandString} --help`)
    await new Promise((r) => setTimeout(r, TIMEOUT))

    const res = await fetch('http://localhost:8910/about')
    const body = await res.text()

    expect(res.status).toEqual(200)
    expect(body).toEqual(
      fs.readFileSync(
        path.join(__dirname, './fixtures/redwood-app/web/dist/about.html'),
        'utf-8'
      )
    )
  })
})
