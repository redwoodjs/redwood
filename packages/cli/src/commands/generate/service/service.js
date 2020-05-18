import { resolve } from 'path'

import camelcase from 'camelcase'
import pluralize from 'pluralize'
import * as prettier from 'prettier'
import * as babel from '@babel/core'

import { prettierOptions } from '../../../lib'
import {
  templateForComponentFile,
  createYargsForComponentGeneration,
} from '../helpers'

export const files = async ({ name, relations, ...rest }) => {
  const componentName = camelcase(pluralize(name))
  const extension = 'ts'
  const configOptions = prettierOptions()
  const serviceFile = templateForComponentFile({
    name,
    componentName: componentName,
    extension: `.${extension}`,
    apiPathSection: 'services',
    generator: 'service',
    templatePath: `service.${extension}.template`,
    templateVars: { relations: relations || [], ...rest },
  })
  const testFile = templateForComponentFile({
    name,
    componentName: componentName,
    extension: `.test.${extension}`,
    apiPathSection: 'services',
    generator: 'service',
    templatePath: `test.${extension}.template`,
    templateVars: { relations: relations || [], ...rest },
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return [serviceFile, testFile].reduce((acc, [outputPath, content]) => {
    const isTypescript = rest.typescript
    if (!isTypescript) {
      content = babel.transform(content, {
        plugins: ['@babel/plugin-transform-typescript', 'generator-prettier'],
        generatorOpts: configOptions,
      }).code
      outputPath = outputPath.replace('.ts', '.js')
    }
    content = prettier.format(content, {
      ...configOptions,
      parser: isTypescript ? 'babel-ts' : 'babel',
    })
    return {
      [outputPath]: content,
      ...acc,
    }
  }, {})
}

export const builder = {
  crud: { type: 'boolean', default: false, desc: 'Create CRUD functions' },
  force: { type: 'boolean', default: false },
  typescript: { type: 'boolean', default: false },
}

export const { command, desc, handler } = createYargsForComponentGeneration({
  componentName: 'service',
  filesFn: files,
})
