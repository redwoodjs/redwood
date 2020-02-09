import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import pluralize from 'pluralize'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate } from 'src/lib'

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  const filename = pascalcase(pluralize.singular(name)) + 'Page'
  const outputPath = path.join(getPaths().web.pages, filename, `${filename}.js`)
  const template = generateTemplate(path.join('page', 'page.js.template'), {
    name,
    path: outputPath,
  })

  return { [outputPath]: template }
}

const routes = ([pageName, pathSpec, ..._rest]) => {
  let computedPathSpec
  if (typeof pathSpec !== 'undefined') {
    computedPathSpec = pathSpec
  } else {
    computedPathSpec = `/${paramCase(pageName)}`
  }
  return [
    `<Route path="${computedPathSpec}" page={${pascalcase(
      pageName
    )}Page} name="${camelcase(pageName)}" />`,
  ]
}

export default {
  name: 'Page',
  command: 'page',
  description: 'Generates a page component',
  files: (args) => files(args),
  routes: (args) => routes(args),
}
