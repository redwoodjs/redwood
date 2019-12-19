import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import path from 'path'
import { generateTemplate } from 'src/lib'

const files = ([pageName, ...rest]) => {
  const name = pascalcase(pageName) + 'Page'
  const outputPath = path.join('pages', name, `${name}.js`)
  const template = generateTemplate(
    path.join('page', 'page.js.template'),
    { name, path }
  )

  return { [outputPath]: template }
}

const routes = ([pageName, ...rest]) => {
  return [
    `<Route path="/${paramCase(pageName)}" page={${pascalcase(pageName)}Page} name="${camelcase(pageName)}" />`
  ]
}

export default {
  name: "Page",
  command: "page",
  description: "Generates a Hammer page component",
  files: args => files(args),
  routes: args => routes(args)
}
