import fs from 'fs'
import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import pluralize from 'pluralize'

import { generateTemplate, templateRoot } from 'src/lib'

const COMPONENT_PATH = path.join('web', 'src', 'components')
const PAGE_PATH = path.join('web', 'src', 'pages')
const PAGES = fs.readdirSync(path.join(templateRoot, 'scaffold', 'pages'))
const COMPONENTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'components')
)
const filenameToPageName = (name) => {
  return name
    .replace(/\.js\.template/, '')
    .replace(/Names/, pascalcase(pluralize(name)))
    .replace(/Name/, pascalcase(pluralize.singular(name)))
    .replace(/Page/, '')
}

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  let fileList = {}

  PAGES.forEach((page) => {
    const outputPageName = page
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      PAGE_PATH,
      outputPageName.replace(/\.js/, ''),
      outputPageName
    )
    const template = generateTemplate(path.join('scaffold', 'pages', page), {
      name,
    })
    fileList[outputPath] = template
  })

  COMPONENTS.forEach((component) => {
    const outputComponentName = component
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      COMPONENT_PATH,
      outputComponentName.replace(/\.js/, ''),
      outputComponentName
    )
    const template = generateTemplate(
      path.join('scaffold', 'components', component),
      {
        name,
      }
    )
    fileList[outputPath] = template
  })

  console.info('fileList', fileList)

  return fileList
}

// add routes for all pages
const routes = ([name, ..._rest]) => {
  const singularName = pascalcase(pluralize.singular(name))

  return PAGES.map((page) => {
    const pageName = filenameToPageName(page)
    let path = `/${paramCase(pageName)}`
    if (pageName.match(/New/)) {
      path = `/${camelcase(singularName)}/new`
    } else if (pageName.match(/Edit/)) {
      path = `/${camelcase(singularName)}/{id}/edit`
    }
    const name = camelcase(pageName)

    return `<Route path="${path}" page={${pageName}Page} name="${name}" />`
  })
}

// also create a full CRUD SDL
const generate = (args) => {
  args[1]['crud'] = true

  return [[['sdl', ...args[0]], args[1]]]
}

export default {
  name: 'Scaffold',
  command: 'scaffold',
  description:
    'Generates pages, SDL and a service for CRUD operations on a single database table',
  files: (args) => files(args),
  routes: (args) => routes(args),
  generate: (args) => generate(args),
}
