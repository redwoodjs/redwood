import fs from 'fs'
import path from 'path'

import chalk from 'chalk'
import terminalLink from 'terminal-link'

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

afterEach(() => {
  jest.restoreAllMocks()
})

test('Generates GraphQL schema', async () => {
  const expectedPath = path.join(FIXTURE_PATH, '.redwood', 'schema.graphql')

  jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(
      (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
        expect(file).toMatch(expectedPath)
        expect(data).toMatchSnapshot()
      }
    )

  const schemaPath = await generateGraphQLSchema()

  expect(schemaPath).toMatch(expectedPath)
})

test('Includes live query directive if serverful and realtime ', async () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/graphqlCodeGen/realtime'
  )
  process.env.RWJS_CWD = fixturePath

  const expectedPath = path.join(fixturePath, '.redwood', 'schema.graphql')

  jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(
      (file: fs.PathOrFileDescriptor, data: string | ArrayBufferView) => {
        expect(file).toMatch(expectedPath)
        expect(data).toMatchSnapshot()
      }
    )

  await generateGraphQLSchema()
})

test('Prints error message when schema loading fails', async () => {
  const fixturePath = path.resolve(
    __dirname,
    './fixtures/graphqlCodeGen/bookshelf'
  )
  process.env.RWJS_CWD = fixturePath
  const oldConsoleError = console.error
  console.error = jest.fn()

  try {
    await generateGraphQLSchema()

    const invocation1to4 = (console.error as jest.Mock).mock.calls.slice(0, 4)
    const invocation5 = (console.error as jest.Mock).mock.calls[4]
    const invocation6 = (console.error as jest.Mock).mock.calls[5]

    expect(invocation1to4).toEqual([
      [''],
      ['Schema loading failed.', 'Unknown type: "Shelf".'],
      [''],
      [
        [
          `  ${chalk.bgYellow(` ${chalk.black.bold('Heads up')} `)}`,
          '',
          chalk.yellow(
            `  It looks like you have a Shelf model in your Prisma schema.`
          ),
          chalk.yellow(
            `  If it's part of a relation, you may have to generate SDL or scaffolding for Shelf too.`
          ),
          chalk.yellow(
            `  So, if you haven't done that yet, ignore this error message and run the SDL or scaffold generator for Shelf now.`
          ),
          '',
          chalk.yellow(
            `  See the ${terminalLink(
              'Troubleshooting Generators',
              'https://redwoodjs.com/docs/schema-relations#troubleshooting-generators'
            )} section in our docs for more help.`
          ),
          '',
        ].join('\n'),
      ],
    ])
    expect(invocation5[0].toString()).toMatch('Error: Unknown type: "Shelf".')
    expect(invocation6[0].trim()).toEqual('')
  } finally {
    console.error = oldConsoleError
    delete process.env.RWJS_CWD
  }
})
