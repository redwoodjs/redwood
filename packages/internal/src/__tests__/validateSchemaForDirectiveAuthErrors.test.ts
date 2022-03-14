import path from 'path'

import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadTypedefs } from '@graphql-tools/load'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { DocumentNode } from 'graphql'

import { getPaths } from '../,,/../paths'
import { validateSchemaForDirectives } from '../validateSchema'

const FIXTURE_ERROR_PATH = path.resolve(
  __dirname,
  '../../../../__fixtures__/example-todo-main-with-errors'
)

const projectTypeSrc = async (sdlFile: string) =>
  await loadTypedefs([`graphql/**/${sdlFile}.sdl.{js,ts}`], {
    loaders: [
      new CodeFileLoader({
        noRequire: true,
        pluckConfig: {
          globalGqlIdentifierName: 'gql',
        },
      }),
    ],
    cwd: getPaths().api.src,
  })

const validateSdlFile = async (sdlFile: string): Promise<boolean> => {
  let isSdlValid

  const projectTypeSrcFiles = await projectTypeSrc(sdlFile)

  try {
    // The output of the above function doesn't give us the documents directly
    const projectDocumentNodes = Object.values(projectTypeSrcFiles)
      .map(({ document }) => document)
      .filter((documentNode): documentNode is DocumentNode => {
        return !!documentNode
      })

    // Merge in the rootSchema with JSON scalars, etc.
    const mergedDocumentNode = mergeTypeDefs([projectDocumentNodes])

    validateSchemaForDirectives(mergedDocumentNode)
    isSdlValid = true
  } catch (e) {
    isSdlValid = false
  }

  return isSdlValid
}

describe('SDL uses auth directives', () => {
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_ERROR_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })
  test('Is valid with proper roles set on directives', async () => {
    const isSdlValid = await validateSdlFile('todosWithAuthRoles')
    expect(isSdlValid).toBe(true)
  })

  test('Is invalid because missing directives', async () => {
    const isSdlValid = await validateSdlFile('todos')
    expect(isSdlValid).toBe(false)
  })

  test('Is invalid due to auth role errors', async () => {
    const isSdlValid = await validateSdlFile('todosWithAuthInvalidRolesErrors')
    expect(isSdlValid).toBe(false)
  })

  test('Is invalid due to auth role errors when the role is missing/null', async () => {
    const isSdlValid = await validateSdlFile('todosWithAuthMissingRoleError')
    expect(isSdlValid).toBe(false)
  })

  test('Is invalid due to auth role being numeric instead of string', async () => {
    const isSdlValid = await validateSdlFile('todosWithNumericRoleAuthError')
    expect(isSdlValid).toBe(false)
  })
})
