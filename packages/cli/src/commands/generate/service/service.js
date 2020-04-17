import camelcase from 'camelcase'
import pluralize from 'pluralize'

import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

export const files = async ({ name, relations, ...rest }) => {
  const componentName = camelcase(pluralize(name))
  const serviceFile = templateForComponentFile({
    name,
    componentName: componentName,
    apiPathSection: 'services',
    generator: 'service',
    templatePath: 'service.js.template',
    templateVars: { relations: relations || [], ...rest },
  })
  const testFile = templateForComponentFile({
    name,
    componentName: componentName,
    extension: '.test.js',
    apiPathSection: 'services',
    generator: 'service',
    templatePath: 'test.js.template',
    templateVars: { relations: relations || [], ...rest },
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

export const builder = {
  crud: { type: 'boolean', default: false, desc: 'Create CRUD functions' },
  force: { type: 'boolean', default: false },
}

export const { command, desc, handler } = createYargsForComponentGeneration({
  componentName: 'service',
  filesFn: files,
})
