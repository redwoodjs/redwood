import fs from 'fs'
import path from 'path'

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
})
