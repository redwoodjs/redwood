import fs from 'fs'
import path from 'path'

import {
  generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb,
} from '../generate/graphqlCodeGen'
import { generateGraphQLSchema } from '../generate/graphqlSchema'
import { ensurePosixPath } from '../paths'

const FIXTURE_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main'
)

beforeAll(() => {
  process.env.RWJS_CWD = FIXTURE_PATH
})

afterAll(() => {
  delete process.env.RWJS_CWD
})

test('Generate gql typedefs web', async () => {
  // Generate schema first
  await generateGraphQLSchema()

  const webPaths = await generateTypeDefGraphQLWeb()
  const webPath = ensurePosixPath(webPaths[0])
  const gqlTypesWebOutput = fs.readFileSync(webPath, 'utf-8')

  expect(webPaths).toHaveLength(1)
  expect(webPath).toMatch('web/types/graphql.d.ts')
  expect(gqlTypesWebOutput).toMatchSnapshot()
}, 10_000) // Set timeout to 10s. Windows test runners are slow.

test('Generate gql typedefs api', async () => {
  // Generate schema first
  await generateGraphQLSchema()

  const apiPaths = await generateTypeDefGraphQLApi()
  const apiPath = ensurePosixPath(apiPaths[0])
  const gqlTypesApiOutput = fs.readFileSync(apiPath, 'utf-8')

  expect(apiPaths).toHaveLength(1)
  expect(apiPath).toMatch('api/types/graphql.d.ts')
  expect(gqlTypesApiOutput).toMatchSnapshot()
}, 10_000) // Set timeout to 10s. Windows test runners are slow.

test('respects user provided codegen config', async () => {
  const customCodegenConfigPath = path.join(FIXTURE_PATH, 'codegen.yml')

  // Add codegen.yml to fixture folder
  fs.writeFileSync(
    customCodegenConfigPath,
    `config:
  omitOperationSuffix: false
  namingConvention:
    typeNames: change-case-all#upperCase`
  )

  // Wrapping in `try` to make sure codegen.yml is always deleted, even if the
  // test fails
  try {
    await generateGraphQLSchema()
    const [outputPath] = await generateTypeDefGraphQLWeb()

    const gqlTypesOutput = fs.readFileSync(outputPath, 'utf-8')

    // Should be upper cased type
    expect(gqlTypesOutput).toContain('ADDTODO_CREATETODOMUTATION')

    // because we override omitOperationSuffix to false, it should append QUERY
    // for __fixtures__/example-todo-main/../NumTodosCell.js
    expect(gqlTypesOutput).toContain('NUMTODOSCELL_GETCOUNTQUERY')
  } finally {
    // Delete added codegen.yml
    fs.rmSync(customCodegenConfigPath)
  }
})

test("Doesn't throw or print any errors with empty project", async () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../../__fixtures__/empty-project'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  try {
    await generateGraphQLSchema()
    await generateTypeDefGraphQLWeb()
    await generateTypeDefGraphQLApi()
  } catch (e) {
    console.error(e)
    // Fail if any of the three above calls throws an error
    expect(false).toBeTruthy()
  }

  try {
    expect(console.error).not.toHaveBeenCalled()
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})

test("Doesn't swallow legit errors - invalidQueryType", async () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/typeDefinitions/invalidQueryType'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  await generateTypeDefGraphQLWeb({ logErrors: true })

  try {
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/field.*softKitten.*Query/),
      })
    )
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})

test("Doesn't swallow legit errors - missingType", async () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/typeDefinitions/missingType'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  await generateTypeDefGraphQLWeb({ logErrors: true })

  try {
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/Unknown type.*Todo/),
      })
    )
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})

test("Doesn't swallow legit errors - nonExistingField", async () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/typeDefinitions/nonExistingField'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  await generateTypeDefGraphQLWeb({ logErrors: true })

  try {
    expect(console.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/field.*done.*Todo/),
      })
    )
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})
