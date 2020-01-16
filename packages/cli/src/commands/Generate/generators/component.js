import path from 'path'

import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate } from 'src/lib'

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  const filename = pascalcase(pluralize.singular(name))
  const outputPath = path.join(getPaths().web.components, filename)
  const componentPath = path.join(outputPath, `${filename}.js`)
  const componentTemplate = generateTemplate(
    path.join('component', 'component.js.template'),
    { name }
  )
  const testPath = path.join(outputPath, `${filename}.test.js`)
  const testTemplate = generateTemplate(
    path.join('component', 'test.js.template'),
    { name }
  )
  const readmePath = path.join(outputPath, `${filename}.mdx`)
  const readmeTemplate = generateTemplate(
    path.join('component', 'readme.mdx.template'),
    { name }
  )

  return {
    [componentPath]: componentTemplate,
    [testPath]: testTemplate,
    [readmePath]: readmeTemplate,
  }
}

export default {
  name: 'Component',
  command: 'component',
  description: 'Generates a React component',
  files: (args) => files(args),
}
