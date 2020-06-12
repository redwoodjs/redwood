import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const COMPONENT_SUFFIX = 'Layout'
const REDWOOD_WEB_PATH_NAME = 'layouts'

export const files = ({ name }) => {
  const layoutFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'layout',
    templatePath: 'layout.js.template',
  })
  const testFile = templateForComponentFile({
    name,
    suffix: COMPONENT_SUFFIX,
    extension: '.test.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'layout',
    templatePath: 'test.js.template',
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [layoutFile, testFile].reduce((acc, [outputPath, content]) => {
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
  componentName: 'layout',
  filesFn: files,
})
