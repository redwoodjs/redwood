import path from 'path'

// Set up RWJS_CWD.
let original_RWJS_CWD

beforeAll(() => {
  original_RWJS_CWD = process.env.RWJS_CWD

  process.env.RWJS_CWD = path.join(__dirname, 'fixtures/redwood-app')
})

afterAll(() => {
  process.env.RWJS_CWD = original_RWJS_CWD
})

describe("the cliHandlers' options haven't unintentionally changed", () => {
  test('both server handler options ', async () => {
    // We have to import this after we've set `RWJS_CWD`
    // because even just importing the cliHandlers file invokes `getConfig`.
    const { commonOptions } = await import('../cliHandlers')

    expect(commonOptions).toMatchInlineSnapshot(`
      {
        "port": {
          "alias": "p",
          "default": 8910,
          "type": "number",
        },
        "socket": {
          "type": "string",
        },
      }
    `)
  })

  test('api server handler options ', async () => {
    const { apiCliOptions } = await import('../cliHandlers')

    expect(apiCliOptions).toMatchInlineSnapshot(`
        {
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
        }
      `)
  })

  test('web server handler options', async () => {
    const { webCliOptions } = await import('../cliHandlers')

    expect(webCliOptions).toMatchInlineSnapshot(`
        {
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
        }
      `)
  })
})
