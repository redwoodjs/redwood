import fs from 'fs'
import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate, templateRoot } from 'src/lib'

const PAGES = fs.readdirSync(path.join(templateRoot, 'scaffold', 'pages'))
const COMPONENTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'components')
)

const files = (args) => {
  const [[name, ..._rest], _flags] = args
  let fileList = {}
  Object.assign(fileList, pageFiles(name))
  Object.assign(fileList, componentFiles(name))

  return fileList
}

const pageFiles = (name) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  let fileList = {}

  PAGES.forEach((page) => {
    const outputPageName = page
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.pages,
      outputPageName.replace(/\.js/, ''),
      outputPageName
    )
    const template = generateTemplate(path.join('scaffold', 'pages', page), {
      name,
    })
    fileList[outputPath] = template
  })

  return fileList
}

const componentFiles = (name) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  let fileList = {}
  const columns = [
    { name: 'id', type: 'Int' },
    { name: 'title', type: 'String' },
    { name: 'body', type: 'String' },
    { name: 'createdAt', type: 'DateTime' },
  ]

  COMPONENTS.forEach((component) => {
    const outputComponentName = component
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.components,
      outputComponentName.replace(/\.js/, ''),
      outputComponentName
    )

    console.info(component)

    const template = generateTemplate(
      path.join('scaffold', 'components', component),
      {
        name,
        columns,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

// add routes for all pages
const routes = ([name, ..._rest]) => {
  const singularPascalName = pascalcase(pluralize.singular(name))
  const pluralPascalName = pascalcase(pluralize(name))
  const singularCamelName = camelcase(singularPascalName)
  const pluralCamelName = camelcase(pluralPascalName)

  return [
    `<Route path="/${pluralCamelName}/{id}/edit" page={Edit${singularPascalName}Page} name="edit${singularPascalName}" />`,
    `<Route path="/${pluralCamelName}/new" page={New${singularPascalName}Page} name="new${singularPascalName}" />`,
    `<Route path="/${pluralCamelName}/{id}" page={${singularPascalName}Page} name="${singularCamelName}" />`,
    `<Route path="/${pluralCamelName}" page={${pluralPascalName}Page} name="${pluralCamelName}" />`,
  ]
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
