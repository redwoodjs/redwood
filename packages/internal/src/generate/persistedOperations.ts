import fs from 'fs'
import path from 'path'

import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader'
import { loadDocuments, loadSchemaSync } from '@graphql-tools/load'
import * as persistedOpIds from 'graphql-codegen-persisted-query-ids'

import { getPaths } from '@redwoodjs/project-config'

import { getLoadDocumentsOptions } from './graphqlCodeGen'

/**
 * Generate persisted operations from GraphQL documents.
 *
 * Persisted operations is a mechanism for preventing the execution of
 * arbitrary GraphQL operation documents.
 *
 * A 'persistedOperation' is a hash of a GraphQL operation document.
 *
 * The file 'persistedOperations.json' contains a map of persisted operation and
 * their hashes. There is a file generated for each side of the app (web and api).
 *
 * The web side is used by the client to send the persisted operation hash to the
 * server. The server then looks up the persisted operation hash in the
 * 'persistedOperations.json' file and executes the GraphQL operation document.
 *
 * The web side is stored in the 'web/src/graphql/persistedOperations.json' file.
 * The api side is stored in the 'api/lib/persistedOperations.json' file.
 *
 * By default, the persisted operations plugin follows the the
 * APQ Specification for SENDING hashes to the server.
 *
 * For example:
 *
 * ```graphql
 * query FindUserExamples {
 *    userExamples {
 *      id
 *      email
 *      name
 *    }
 *  }
 *  ```
 *
 * will become the persisted operation has for `FindUserExamples`:
 *
 * ```json
 * {
 *    "EditUserExampleById": "5649dcc8f4aaf6ecd4b43d8bd147d20b848170ce203c4af8aecaf5087c00ae7f",
 *    "UpdateUserExampleMutation": "f527c29d63ce51037ab60cd5d6b8450a9e6b79ec68197d7c6c5efe206924b35a",
 *    "CreateUserExampleMutation": "c85593858a95e9799d3350d8c51607a98f6b726b8497da5d422530bd4334f79d",
 *    "DeleteUserExampleMutation": "3ef9cc7b49ed1751649b04e6ba7c8bfce58f3e2a849886a520e5e8137b687a43",
 *    "FindUserExampleById": "a9510c2d64eb0956f90a25ca00a5364497c76adef8f2db9c93fb2e562b8a2208",
 *    "FindUserExamples": "f4e93aec76f24e336b4922baab785227ca84ee4faef3a4100d8ae9a6371baafc"
 * }
 * ```
 *
 * @see https://the-guild.dev/graphql/yoga-server/docs/features/persisted-operations
 * @see https://www.apollographql.com/docs/apollo-server/performance/apq/
 * @see https://github.com/apollographql/apollo-link-persisted-queries#apollo-engine
 **/
const generatePersistedOperationsForSide = async (
  side: 'web' | 'api'
): Promise<any> => {
  const filename =
    side === 'web'
      ? path.join(getPaths().web.graphql, 'persistedOperations.json')
      : path.join(getPaths().api.lib, 'persistedOperations.json')
  const options = getLoadDocumentsOptions(getPaths().web.src)
  const documentsGlob = './web/src/**/!(*.d).{ts,tsx,js,jsx}'

  let documents

  try {
    documents = (await loadDocuments(
      [documentsGlob],
      options
    )) as unknown as any
  } catch {
    // No GraphQL documents present, no need to try to generate persistedOperations
    return {
      persistedOperationsFiles: [],
      errors: [],
    }
  }

  const errors: { message: string; error: unknown }[] = []

  try {
    const files = []
    const pluginConfig = {
      output: side === 'web' ? 'client' : 'client',
      algorithm: 'sha256',
    } as persistedOpIds.PluginConfig
    const info = {
      outputFile: filename,
    }

    // note: the persisted ops plugin uses an older version of graphql and hence the types need some coercion
    const schema = loadSchemaSync(getPaths().generated.schema, {
      loaders: [new GraphQLFileLoader()],
      sort: true,
    }) as unknown as any

    const persistedOperations = await persistedOpIds.plugin(
      schema,
      documents,
      pluginConfig,
      info
    )

    files.push(filename)

    const output = persistedOperations.toString()

    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, output)

    console.log('Persisted Operations return:', {
      persistedOperationsFiles: [filename],
      errors,
    })
    return { persistedOperationsFiles: [filename], errors } // ?
  } catch (e) {
    errors.push({
      message:
        'Error: Could not generate GraphQL persisted operations (client)',
      error: e,
    })

    return {
      persistedOperationsFiles: [],
      errors,
    }
  }
}

export const generatePersistedOperations = async () => {
  const {
    persistedOperationsFiles: persistedOperationsFilesWeb,
    errors: errorsWeb,
  } = await generatePersistedOperationsForSide('web')

  const {
    persistedOperationsFiles: persistedOperationsFilesApi,
    errors: errorsApi,
  } = await generatePersistedOperationsForSide('api')

  return {
    persistedOperationsFiles: [
      ...persistedOperationsFilesWeb,
      ...persistedOperationsFilesApi,
    ],
    errors: [...errorsWeb, ...errorsApi],
  }
}
