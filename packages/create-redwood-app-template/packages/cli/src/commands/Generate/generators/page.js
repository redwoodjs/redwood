import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'

import { generateTemplate } from 'src/lib'

const OUTPUT_PATH = path.join('web', 'src', 'pages')

const files = (args) => {
  const [[pageName, ..._rest], _flags] = args
  const name = pascalcase(pageName) + 'Page'
  const outputPath = path.join(OUTPUT_PATH, name, `${name}.js`)
  const template = generateTemplate(path.join('page', 'page.js.template'), {
    name,
    path: outputPath,
  })

  return { [outputPath]: template }
}

const routes = ([pageName, ..._rest]) => {
  return [
    `<Route path="/${paramCase(pageName)}" page={${pascalcase(
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
