import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'

import { generateTemplate } from 'src/lib'

const COMPONENT_PATH = path.join('web', 'src', 'components')
const PAGE_PATH = path.join('web', 'src', 'pages')
const PAGES = ['EditNamePage', 'NamePage', 'NamesPage', 'NewNamePage']
const COMPONENTS = ['EditNameCell', 'NameForm', 'NamesCell', 'NamesList', 'NewName', 'ShowName']

const files = (args) => {
  const [[objName, ..._rest], _flags] = args
  const name = pascalcase(pageName) + 'Page'
  const outputPath = path.join(OUTPUT_PATH, name, `${name}.js`)
  const template = generateTemplate(path.join('page', 'page.js.template'), {
    name,
    path: outputPath,
  })

  return { [outputPath]: template }
}

// add routes for all pages
const routes = ([objName, ..._rest]) => {
  return PAGES.map(page => {

    const pageName = page.replace(/Names/, ) + pascalcase(objName)
    const path = `/${paramCase(pageName)}`
    const name = camelcase(pageName)

    return `<Route path="${path}" page={${pageName}Page} name="${name}" />`
  })
}

// also create a full CRUD SDL
const generate = (args) => {
  console.info('generate args', args)
  args[1]['crud'] = true

  return [[['sdl', ...args[0]], args[1]]]
}

export default {
  name: 'Scaffold',
  command: 'scaffold',
  description:
    'Generates pages, SDL and a service for CRUD operations on a single database table',
  routes: (args) => routes(args),
  generate: (args) => generate(args)
}
