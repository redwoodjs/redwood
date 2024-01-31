import fs from 'fs'
import path from 'path'

const distPath = path.join(__dirname, 'dist')
const packageConfig = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

describe('dist', () => {
  it("shouldn't have the __tests__ directory", () => {
    expect(fs.existsSync(path.join(distPath, '__tests__'))).toEqual(false)
  })

  it('exports CLI config', async () => {
    const original_RWJS_CWD = process.env.RWJS_CWD

    process.env.RWJS_CWD = path.join(
      __dirname,
      'src/__tests__/fixtures/redwood-app'
    )

    const mod = await import(path.resolve(distPath, './cliConfig.js'))

    expect(mod).toMatchInlineSnapshot(`
      {
        "apiServerCLIConfig": {
          "builder": [Function],
          "command": "api",
          "description": "Start a server for serving only the api side",
          "handler": [Function],
        },
        "bothServerCLIConfig": {
          "builder": [Function],
          "description": "Start a server for serving both the api and web sides",
          "handler": [Function],
        },
      }
    `)

    process.env.RWJS_CWD = original_RWJS_CWD
  })

  it('ships three bins', () => {
    expect(packageConfig.bin).toMatchInlineSnapshot(`
      {
        "rw-api-server-watch": "./dist/watch.js",
        "rw-log-formatter": "./dist/logFormatter/bin.js",
        "rw-server": "./dist/bin.js",
      }
    `)
  })
})
