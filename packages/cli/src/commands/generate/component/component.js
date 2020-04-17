import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

const REDWOOD_WEB_PATH_NAME = 'components'

export const files = ({ name }) => {
  const componentFile = templateForComponentFile({
    name,
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'component',
    templatePath: 'component.js.template',
  })
  const testFile = templateForComponentFile({
    name,
    extension: '.test.js',
    webPathSection: REDWOOD_WEB_PATH_NAME,
    generator: 'component',
    templatePath: 'test.js.template',
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [componentFile, testFile].reduce((acc, [outputPath, content]) => {
    return {
      [outputPath]: content,
      ...acc,
    }
  }, {})
}

export const {
  command,
  desc,
  builder,
  handler,
} = createYargsForComponentGeneration({
  componentName: 'component',
  filesFn: files,
})
