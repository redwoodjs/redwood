import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { getSchema } from 'src/lib'

import { yargsDefaults } from '../../generate'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Cell'
const REDWOOD_WEB_PATH_NAME = 'components'

const getCellOperationNames = async () => {
  const { getProject } = await import('@redwoodjs/structure')

  return getProject()
    .cells.map((x) => {
      return x.queryOperationName
    })
    .filter(Boolean)
}

const uniqueOperationName = async (name, index = 1) => {
  let operationName =
    index <= 1
      ? `${pascalcase(name)}Query`
      : `${pascalcase(name)}Query_${index}`

  const cellOperationNames = await getCellOperationNames()
  if (!cellOperationNames.includes(operationName)) {
    return operationName
  }
  return uniqueOperationName(name, index + 1)
}

const getIdType = (model) => {
  return model.fields.find((field) => field.isId)?.type
}

export const files = async ({
  name,
  typescript: generateTypescript,
  ...options
}) => {
  const model = await getSchema(pascalcase(pluralize.singular(name)))

  let cellName = name
  let templateNameSuffix = ''

  if (options.list) {
    console.log(`Making list cell ${options.list}`)
    console.log(options)
    console.log(options.list)
    cellName = options.list
    templateNameSuffix = 'List'
  }

  // Create a unique operation name.
  const operationName = await uniqueOperationName(cellName)

  const cellFile = templateForComponentFile({
    name: cellName,
    suffix: COMPONENT_SUFFIX,
    extension: generateTypescript ? '.tsx' : '.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: `cell${templateNameSuffix}.js.template`,
    templateVars: {
      operationName,
      idType: getIdType(model),
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
    return {
      [outputPath]: content,
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
        default: null,
        description:
          'Use when you want to generate a cell for a list of the model name.',
        type: 'string',
      },
    },
  })
