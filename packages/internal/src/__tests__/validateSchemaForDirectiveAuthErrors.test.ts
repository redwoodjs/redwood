import path from 'path'

import { CodeFileLoader } from '@graphql-tools/code-file-loader'
import { loadTypedefs } from '@graphql-tools/load'
import { mergeTypeDefs } from '@graphql-tools/merge'
import { DocumentNode } from 'graphql'

import { getPaths } from '../,,/../paths'
import {
  validateSchemaForDirectives,
  DIRECTIVE_REQUIRED_ERROR_MESSAGE,
  DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE,
} from '../validateSchema'

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

const validateSdlFile = async (sdlFile: string) => {
  const projectTypeSrcFiles = await projectTypeSrc(sdlFile)

  // The output of the above function doesn't give us the documents directly
  const projectDocumentNodes = Object.values(projectTypeSrcFiles)
    .map(({ document }) => document)
    .filter((documentNode): documentNode is DocumentNode => {
      return !!documentNode
    })

  // Merge in the rootSchema with JSON scalars, etc.
  const mergedDocumentNode = mergeTypeDefs([projectDocumentNodes])
  validateSchemaForDirectives(mergedDocumentNode)
}

describe('SDL uses auth directives', () => {
  beforeAll(() => {
    process.env.RWJS_CWD = FIXTURE_ERROR_PATH
  })
  afterAll(() => {
    delete process.env.RWJS_CWD
  })
  test('is valid with proper roles set on directives', async () => {
    await expect(
      validateSdlFile('todosWithAuthRoles')
    ).resolves.not.toThrowError()
  })

  test('is invalid because missing directives', async () => {
    await expect(validateSdlFile('todos')).rejects.toThrowError(
      DIRECTIVE_REQUIRED_ERROR_MESSAGE
    )
  })

  test('is invalid due to auth role errors', async () => {
    await expect(
      validateSdlFile('todosWithAuthInvalidRolesErrors')
    ).rejects.toThrowError(DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE)
  })

  test('is invalid due to auth role errors when the role is missing/null', async () => {
    await expect(
      validateSdlFile('todosWithAuthMissingRoleError')
    ).rejects.toThrowError(DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE)
  })

  test('is invalid due to auth role being numeric instead of string', async () => {
    await expect(
      validateSdlFile('todosWithAuthMissingRoleError')
    ).rejects.toThrowError(DIRECTIVE_INVALID_ROLE_TYPES_ERROR_MESSAGE)
  })
})
