import { generate as generateTypes } from '@redwoodjs/internal/dist/generate/generate'
import { getQueryArguments } from '@redwoodjs/internal/dist/gql'

import { nameVariants, transformTSToJS } from '../../../lib'
import { isWordPluralizable } from '../../../lib/pluralHelpers'
import { addFunctionToRollback } from '../../../lib/rollback'
import { isPlural, pluralize } from '../../../lib/rwPluralize'
import { yargsDefaults } from '../helpers'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
  forcePluralizeWord,
  removeGeneratorName,
} from '../helpers'

import {
  checkProjectForQueryField,
  operationNameIsUnique,
  uniqueOperationName,
} from './utils/utils'

const COMPONENT_SUFFIX = 'Cell'
const REDWOOD_WEB_PATH_NAME = 'components'

export const files = async ({
  name,
  typescript: generateTypescript,
  ...options
}) => {
  let cellName = removeGeneratorName(name, 'cell')
  let queryArgs,
    mockIdValues = [42, 43, 44],
    isSingleIdArgument
  let templateNameSuffix = ''

  // Create a unique operation name.

  const shouldGenerateList =
    options.list || (isWordPluralizable(cellName) && isPlural(cellName))

  // needed for the singular cell GQL query find by id case
  try {
    const queryName = shouldGenerateList ? pluralize(cellName) : cellName

    queryArgs = await getQueryArguments(queryName)

    isSingleIdArgument = queryArgs.length === 1 && queryArgs[0].name === 'id'

    // todo support more complex mocks
    mockIdValues =
      isSingleIdArgument && queryArgs[0].type === 'String!'
        ? mockIdValues.map((value) => `'${value}'`)
        : mockIdValues
  } catch (e) {
    // Eat error so that the destroy cell generator doesn't raise an error
    // when trying to find prisma query engine in test runs.

    // Assume id will be Int, otherwise generated cell will keep throwing
    queryArgs = [{ name: 'id', type: 'Int!' }]
    isSingleIdArgument = true
  }

  let idType
  if (isSingleIdArgument) {
    idType = queryArgs[0].type
  }

  if (shouldGenerateList) {
    cellName = forcePluralizeWord(cellName)
    templateNameSuffix = 'List'
    // override operationName so that its find_operationName
  }

  let operationName = options.query
  if (operationName) {
    const userSpecifiedOperationNameIsUnique = await operationNameIsUnique(
      operationName
    )
    if (!userSpecifiedOperationNameIsUnique) {
      throw new Error(`Specified query name: "${operationName}" is not unique!`)
    }
  } else {
    operationName = await uniqueOperationName(cellName, {
      list: shouldGenerateList,
    })
  }

  let operationVariables, resolverInput
  if (isSingleIdArgument) {
    operationVariables = `$id: ${idType}`
    resolverInput = 'id: $id'
  } else {
    operationVariables = queryArgs
      .map((a) => `$${a.name}: ${a.type}`)
      .join(', ')
    resolverInput = queryArgs.map((a) => `${a.name}: $${a.name}`)
  }

  // support queries with no inputs
  if (operationVariables) {
    operationVariables = `(${operationVariables})`
    resolverInput = `(${resolverInput})`
  }

  const cellFile = templateForComponentFile({
    name: cellName,
    suffix: COMPONENT_SUFFIX,
    extension: generateTypescript ? '.tsx' : '.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: `cell${templateNameSuffix}.tsx.template`,
    templateVars: {
      operationName,
      // @deprecated use operationVariables & resolverInput instead
      idType,
      operationVariables,
      resolverInput,
    },
  })

  const testFile = templateForComponentFile({
    name: cellName,
    suffix: COMPONENT_SUFFIX,
    extension: generateTypescript ? '.test.tsx' : '.test.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: 'test.js.template',
  })

  const storiesFile = templateForComponentFile({
    name: cellName,
    suffix: COMPONENT_SUFFIX,
    extension: generateTypescript ? '.stories.tsx' : '.stories.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: 'stories.js.template',
  })

  const mockFile = templateForComponentFile({
    name: cellName,
    suffix: COMPONENT_SUFFIX,
    extension: generateTypescript ? '.mock.ts' : '.mock.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: `mock${templateNameSuffix}.js.template`,
    templateVars: {
      mockIdValues,
    },
  })

  const files = [cellFile]

  if (options.stories) {
    files.push(storiesFile)
  }

  if (options.tests) {
    files.push(testFile)
  }

  if (options.stories || options.tests) {
    files.push(mockFile)
  }

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
    const template = generateTypescript
      ? content
      : transformTSToJS(outputPath, content)

    return {
      [outputPath]: template,
      ...acc,
    }
  }, {})
}

export const { command, description, builder, handler } =
  createYargsForComponentGeneration({
    componentName: 'cell',
    filesFn: files,
    optionsObj: {
      ...yargsDefaults,
      list: {
        alias: 'l',
        default: false,
        description:
          'Use when you want to generate a cell for a list of the model name.',
        type: 'boolean',
      },
      query: {
        default: '',
        description:
          'Use to enforce a specific query name within the generated cell - must be unique.',
        type: 'string',
      },
    },
    includeAdditionalTasks: ({ name: cellName }) => {
      return [
        {
          title: `Generating types ...`,
          task: async (_ctx, task) => {
            const queryFieldName = nameVariants(
              removeGeneratorName(cellName, 'cell')
            ).camelName
            const projectHasSdl = await checkProjectForQueryField(
              queryFieldName
            )

            if (projectHasSdl) {
              await generateTypes()
              addFunctionToRollback(generateTypes, true)
            } else {
              task.skip(
                `Skipping type generation: no SDL defined for "${queryFieldName}". To generate types, run 'yarn rw g sdl ${queryFieldName}'.`
              )
            }
          },
        },
      ]
    },
  })
