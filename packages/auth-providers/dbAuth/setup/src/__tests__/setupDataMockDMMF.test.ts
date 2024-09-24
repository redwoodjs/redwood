import * as fs from 'node:fs'
import * as path from 'node:path'

import { vol } from 'memfs'
import prompts from 'prompts'

import type { AuthHandlerArgs } from '@redwoodjs/cli-helpers'
import type { AuthGeneratorCtx } from '@redwoodjs/cli-helpers/src/auth/authTasks'

import { createUserModelTask } from '../setupData'
import { handler } from '../setupHandler'

const RWJS_CWD = process.env.RWJS_CWD
const redwoodProjectPath = '/redwood-app'

const dbSchemaPath = redwoodProjectPath + '/api/db/schema.prisma'
const libPath = redwoodProjectPath + '/api/src/lib'
const functionsPath = redwoodProjectPath + '/api/src/functions'

jest.mock('fs', () => require('memfs').fs)
jest.mock('node:fs', () => require('memfs').fs)

jest.mock('@redwoodjs/cli-helpers', () => {
  return {
    getGraphqlPath: () => {
      return redwoodProjectPath + '/api/src/functions/graphql.ts'
    },
    getPaths: () => ({
      base: redwoodProjectPath,
      api: {
        dbSchema: dbSchemaPath,
        lib: libPath,
        functions: functionsPath,
      },
    }),
    colors: {
      error: (str: string) => str,
      warning: (str: string) => str,
      green: (str: string) => str,
      info: (str: string) => str,
      bold: (str: string) => str,
      underline: (str: string) => str,
    },
    addEnvVarTask: () => {},
    // I wish I could have used something like
    // jest.requireActual(@redwoodjs/cli-helpers) here, but I couldn't because
    // jest doesn't support ESM
    standardAuthHandler: async (args: AuthHandlerArgs) => {
      if (args.extraTasks) {
        const ctx: AuthGeneratorCtx = {
          force: args.forceArg,
          setupMode: 'UNKNOWN',
          provider: 'dbAuth',
        }

        for (const task of args.extraTasks) {
          if (task?.task) {
            await task.task(ctx, undefined)
          }
        }
      }

      if (args.notes) {
        console.log(`\n   ${args.notes.join('\n   ')}\n`)
      }
    },
  }
})

jest.mock('@prisma/internals', () => ({
  getSchema: () => {
    const fs = require('node:fs')
    return fs.readFileSync(dbSchemaPath, 'utf-8')
  },
  getDMMF: () => {
    const fs = require('node:fs')
    const schema: string = fs.readFileSync(dbSchemaPath, 'utf-8')

    const models = schema
      .split('\n')
      .filter((line) => /model \w+ {/.test(line))
      .map((line) => line.split(' ')[1])
      .map((model) => ({ name: model }))

    return {
      datamodel: {
        models,
      },
    }
  },
}))

jest.mock('prompts', () => {
  return {
    __esModule: true,
    default: jest.fn(async (args: any) => {
      return {
        [args.name]: false,
      }
    }),
  }
})

beforeAll(() => {
  process.env.RWJS_CWD = redwoodProjectPath
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
})

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  jest.mocked(console).log.mockRestore?.()
  jest.mocked(prompts).mockClear?.()
})

describe('setupData createUserModelTask', () => {
  it('adds a User model to schema.prisma', async () => {
    vol.fromJSON(
      {
        'api/db/schema.prisma': `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}
`,
      },
      redwoodProjectPath,
    )

    await createUserModelTask.task({
      force: false,
      setupMode: 'UNKNOWN',
      provider: 'dbAuth',
    })

    const schema = fs.readFileSync(dbSchemaPath, 'utf-8')
    expect(schema).toMatch(/^model User {$/m)
  })

  it('adds a User model to schema.prisma with existing UserExample model', async () => {
    vol.fromJSON(
      {
        'api/db/schema.prisma': `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

// Define your own data models here and run 'yarn redwood prisma migrate dev'
// to create migrations for them and apply to your dev DB.
model UserExample {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`,
      },
      redwoodProjectPath,
    )

    await createUserModelTask.task({
      force: false,
      setupMode: 'UNKNOWN',
      provider: 'dbAuth',
    })

    const schema = fs.readFileSync(dbSchemaPath, 'utf-8')
    expect(schema).toMatch(/^model User {$/m)
  })

  it('Does not add another User model if one already exists', async () => {
    vol.fromJSON(
      {
        'api/db/schema.prisma': `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
`,
      },
      redwoodProjectPath,
    )

    await expect(() => {
      return createUserModelTask.task({
        force: false,
        setupMode: 'UNKNOWN',
        provider: 'dbAuth',
      })
    }).rejects.toThrow('User model already exists')

    const schema = fs.readFileSync(dbSchemaPath, 'utf-8')

    expect(schema.match(/^model User {/gm)).toHaveLength(1)
  })

  it('automatically adds a User model in fresh projects', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')

    vol.fromJSON(
      {
        [packageJsonPath]: '{ "version": "0.0.0" }',
        'api/src/functions/graphql.ts': `
import { createGraphQLHandler } from "@redwoodjs/graphql-server"

import { getCurrentUser } from 'src/lib/auth'
`,
        'api/db/schema.prisma': `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

// Define your own data models here and run 'yarn redwood prisma migrate dev'
// to create migrations for them and apply to your dev DB.
model UserExample {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`,
      },
      redwoodProjectPath,
    )

    await handler({
      webauthn: false,
      createUserModel: null,
      generateAuthPages: false,
      force: false,
    })

    expect(jest.mocked(prompts)).not.toHaveBeenCalled()

    const schema = fs.readFileSync(dbSchemaPath, 'utf-8')
    expect(schema).toMatch(/^model User {$/m)
    expect(jest.mocked(console).log).toHaveBeenCalledWith(
      expect.stringContaining('Done! But you have a little more work to do:'),
    )
    expect(jest.mocked(console).log).not.toHaveBeenCalledWith(
      expect.stringContaining('resetTokenExpiresAt DateTime? // <─'),
    )
  })

  it('automatically adds a User model given the rwjs template schema.prisma', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')

    vol.fromJSON(
      {
        [packageJsonPath]: '{ "version": "0.0.0" }',
        'api/src/functions/graphql.ts': `
import { createGraphQLHandler } from "@redwoodjs/graphql-server"

import { getCurrentUser } from 'src/lib/auth'
`,
        'api/db/schema.prisma': jest
          .requireActual('fs')
          .readFileSync(
            path.resolve(
              __dirname +
                '/../../../../../create-redwood-app/templates/ts/api/db/schema.prisma',
            ),
            'utf-8',
          ),
      },
      redwoodProjectPath,
    )

    await handler({
      webauthn: false,
      createUserModel: null,
      generateAuthPages: false,
      force: false,
    })

    expect(jest.mocked(prompts)).not.toHaveBeenCalled()

    const schema = fs.readFileSync(dbSchemaPath, 'utf-8')
    // Check for UserExample just to make sure we're reading the actual
    // template file and that it looks like we expect. So we're not just
    // getting an empty file or something
    expect(schema).toMatch(/^model UserExample {$/m)
    expect(schema).toMatch(/^model User {$/m)
    expect(jest.mocked(console).log).toHaveBeenCalledWith(
      expect.stringContaining('Done! But you have a little more work to do:'),
    )
    expect(jest.mocked(console).log).not.toHaveBeenCalledWith(
      expect.stringContaining('resetTokenExpiresAt DateTime? // <─'),
    )
  })

  it('does not automatically add a User model in projects with custom db models', async () => {
    const packageJsonPath = path.resolve(__dirname, '../../package.json')

    vol.fromJSON(
      {
        [packageJsonPath]: '{ "version": "0.0.0" }',
        'api/src/functions/graphql.ts': `
import { createGraphQLHandler } from "@redwoodjs/graphql-server"

import { getCurrentUser } from 'src/lib/auth'
`,
        'api/db/schema.prisma': `
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = "native"
}

model ExampleModel {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
}
`,
      },
      redwoodProjectPath,
    )

    await handler({
      webauthn: false,
      createUserModel: null,
      generateAuthPages: false,
      force: false,
    })

    expect(jest.mocked(prompts)).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Create User model?'),
      }),
    )

    const schema = fs.readFileSync(dbSchemaPath, 'utf-8')
    expect(schema).not.toMatch(/^model User {$/m)
    expect(jest.mocked(console).log).toHaveBeenCalledWith(
      expect.stringContaining('Done! But you have a little more work to do:'),
    )
    expect(jest.mocked(console).log).toHaveBeenCalledWith(
      expect.stringContaining('resetTokenExpiresAt DateTime? // <─'),
    )
  })
})
