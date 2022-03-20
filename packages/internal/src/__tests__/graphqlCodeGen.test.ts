import fs from 'fs'
import path from 'path'

import {
  generateTypeDefGraphQLApi,
  generateTypeDefGraphQLWeb,
} from '../generate/graphqlCodeGen'
import { generateGraphQLSchema } from '../generate/graphqlSchema'

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
  await generateGraphQLSchema()

  const webPaths = await generateTypeDefGraphQLWeb()
  const gqlTypesWebOutput = fs.readFileSync(webPaths[0], 'utf-8')

  expect(webPaths).toHaveLength(1)
  expect(webPaths[0]).toMatch(path.join('web', 'types', 'graphql.d.ts'))

  // This would be better tested with a snapshot, but I couldn't get them
  // working on GitHub CI
  expect(gqlTypesWebOutput).toContain('export type Maybe<T> = T | null;')
  expect(gqlTypesWebOutput).toContain('String: string')
  expect(gqlTypesWebOutput).toContain('BigInt: number;')
  expect(gqlTypesWebOutput).toContain('JSONObject: Record<string, unknown>')
  expect(gqlTypesWebOutput).toContain('updateTodoStatus?: Maybe<Todo>;')
  expect(gqlTypesWebOutput).toContain(
    'export type MutationupdateTodoStatusArgs = {'
  )
  expect(gqlTypesWebOutput).toContain(
    "export type AddTodo_CreateTodo = { __typename?: 'Mutation', createTodo?: { __typename: 'Todo', id: number, body: string, status: string } | null };"
  )
  expect(gqlTypesWebOutput)
    .toContain(`export type TodoListCell_CheckTodoVariables = Exact<{
  id: Scalars['Int'];
  status: Scalars['String'];
}>;`)
  expect(gqlTypesWebOutput).toContain(
    "export type TodoListCell_GetTodos = { __typename?: 'Query', todos?: Array<{ __typename?: 'Todo', id: number, body: string, status: string } | null> | null };"
  )
})

test('Generate gql typedefs api', async () => {
  await generateGraphQLSchema()

  const apiPaths = await generateTypeDefGraphQLApi()
  const gqlTypesApiOutput = fs.readFileSync(apiPaths[0], 'utf-8')

  expect(apiPaths).toHaveLength(1)
  expect(apiPaths[0]).toMatch(path.join('api', 'types', 'graphql.d.ts'))

  // This would be better tested with a snapshot, but I couldn't get them
  // working on GitHub CI
  expect(gqlTypesApiOutput).toContain('export type Maybe<T> = T | null;')
  expect(gqlTypesApiOutput).toContain('JSON: Record<string, unknown>;')
  expect(gqlTypesApiOutput)
    .toContain(`export type MutationupdateTodoStatusArgs = {
  id: Scalars['Int'];
  status: Scalars['String'];
};`)
  expect(gqlTypesApiOutput).toContain(`export type Redwood = {
  __typename?: 'Redwood';
  currentUser?: Maybe<Scalars['JSON']>;
  prismaVersion?: Maybe<Scalars['String']>;
  version?: Maybe<Scalars['String']>;
};`)
  expect(gqlTypesApiOutput).toContain(`export type Todo = {
  __typename?: 'Todo';
  body: Scalars['String'];
  id: Scalars['Int'];
  status: Scalars['String'];
};`)
  expect(gqlTypesApiOutput).toContain('JSON?: GraphQLScalarType;')
  expect(gqlTypesApiOutput)
    .toContain(`export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}`)
})

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
