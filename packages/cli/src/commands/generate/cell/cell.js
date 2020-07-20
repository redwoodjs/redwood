import { getProject } from '@redwoodjs/structure'

import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Cell'
const REDWOOD_WEB_PATH_NAME = 'components'

const getCellOperationNames = () => {
  return getProject()
    .cells.map((x) => {
      return x.queryOperationName
    })
    .filter(Boolean)
}

const uniqueOperationName = (name, index = 1) => {
  let operationName = index <= 1 ? `${name}Query` : `${name}Query_${index}`
  if (!getCellOperationNames().includes(operationName)) {
    return operationName
  }
  return uniqueOperationName(name, index + 1)
}

export const files = ({ name }) => {
  // Create a unique operation name.
  const operationName = uniqueOperationName(name)

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

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [cellFile, testFile, storiesFile, mockFile].reduce(
    (acc, [outputPath, content]) => {
      return {
        [outputPath]: content,
        ...acc,
      }
    },
    {}
  )
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
