import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import lodash from 'lodash/string'
import path from 'path'
import { readFile, templateRoot } from 'src/lib'

const TEMPLATE_PATH = path.join(templateRoot, 'page', 'page.js.template')

const files = args => {
  const [_commandName, _generatorName, pageName, ...rest] = args
  const name = pascalcase(pageName) + 'Page'
  const path = `pages/${name}/${name}.js`

  const pageTemplate = lodash.template(readFile(TEMPLATE_PATH).toString())

  return {
    [path]: pageTemplate({ name, path })
  }
}

const routes = args => {
  const [_commandName, _generatorName, name, ...rest] = args

  return [
    `<Route path="/${paramCase(name)}" page={${pascalcase(name)}Page} name="${camelcase(name)}" />`
  ]
}

export default {
  name: "Page",
  command: "page",
  description: "Generates a Hammer page component",
  files: (args) => files(args),
  routes: (args) => routes(args),
}
