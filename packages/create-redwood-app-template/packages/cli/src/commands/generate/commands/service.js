import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

export const files = async ({ name, ...rest }) => {
  console.info(rest)
  const serviceFile = templateForComponentFile({
    name,
    apiPathSection: 'services',
    templatePath: 'service/service.js.template',
    templateVars: { ...rest },
  })
  const testFile = templateForComponentFile({
    name,
    extension: '.test.js',
    apiPathSection: 'services',
    templatePath: 'service/test.js.template',
    templateVars: { ...rest },
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [serviceFile, testFile].reduce((acc, [outputPath, content]) => {
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
  componentName: 'service',
  filesFn: files,
})
