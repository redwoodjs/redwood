import pascalcase from 'pascalcase'

import {
  templateForComponentFile,
  createYargsForComponentGeneration,
  splitPathAndName,
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
  const { name: splittedName } = splitPathAndName(name)

  let operationName =
    index <= 1
      ? `${pascalcase(splittedName)}Query`
      : `${pascalcase(splittedName)}Query_${index}`

  const cellOperationNames = await getCellOperationNames()
  if (!cellOperationNames.includes(operationName)) {
    return operationName
  }
  return uniqueOperationName(splittedName, index + 1)
}

export const files = async ({ name, tests = true, stories = true }) => {
  // Create a unique operation name.
  const operationName = await uniqueOperationName(name)

  const cellFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: 'cell.js.template',
    templateVars: {
      operationName,
    },
  })
  const testFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: '.test.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: 'test.js.template',
  })
  const storiesFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: '.stories.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: 'stories.js.template',
  })
  const mockFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: '.mock.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'cell',
    templatePath: 'mock.js.template',
  })

  const files = [cellFile]

  if (stories) {
    files.push(storiesFile)
  }

  if (tests) {
    files.push(testFile)
  }

  if (stories || tests) {
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

export const {
  command,
  description,
  builder,
  handler,
} = createYargsForComponentGeneration({
  componentName: 'cell',
  filesFn: files,
})
