import * as fs from 'node:fs'

import { vol } from 'memfs'

import { createUserModelTask } from '../setupData'

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
  }
})

jest.mock('@prisma/internals', () => ({
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

beforeAll(() => {
  process.env.RWJS_CWD = redwoodProjectPath
})

afterAll(() => {
  process.env.RWJS_CWD = RWJS_CWD
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
})
