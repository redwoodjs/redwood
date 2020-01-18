import fs from 'fs'
import path from 'path'

import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { getDMMF } from '@prisma/sdk'
import { getPaths } from '@redwoodjs/core'

import { generateTemplate, templateRoot, readFile, asyncForEach } from 'src/lib'

const NON_EDITABLE_COLUMNS = ['id', 'createdAt', 'updatedAt']
const LAYOUTS = fs.readdirSync(path.join(templateRoot, 'scaffold', 'layouts'))
const PAGES = fs.readdirSync(path.join(templateRoot, 'scaffold', 'pages'))
const COMPONENTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'components')
)

const sdlFromSchemaModel = async (name) => {
  const metadata = await getDMMF({
    datamodel: readFile(
      path.join(getPaths().api.db, 'schema.prisma')
    ).toString(),
  })

  const model = metadata.datamodel.models.find((model) => {
    return model.name === name
  })

  if (model) {
    return model
  } else {
    throw `no schema definition found for \`${name}\``
  }
}

const files = async (args) => {
  const [[name, ..._rest], _flags] = args
  let fileList = {}
  Object.assign(fileList, layoutFiles(name))
  Object.assign(fileList, pageFiles(name))
  Object.assign(fileList, await componentFiles(name))

  return fileList
}

const layoutFiles = (name) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  let fileList = {}

  LAYOUTS.forEach((layout) => {
    const outputLayoutName = layout
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.layouts,
      outputLayoutName.replace(/\.js/, ''),
      outputLayoutName
    )
    const template = generateTemplate(
      path.join('scaffold', 'layouts', layout),
      {
        name,
      }
    )
    fileList[outputPath] = template
  })

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

const componentFiles = async (name) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  const model = await sdlFromSchemaModel(singularName)
  const columns = model.fields
  let fileList = {}
  const editableColumns = columns.filter((column) => {
    return NON_EDITABLE_COLUMNS.indexOf(column.name) === -1
  })

  await asyncForEach(COMPONENTS, (component) => {
    const outputComponentName = component
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.template/, '')
    const outputPath = path.join(
      getPaths().web.components,
      outputComponentName.replace(/\.js/, ''),
      outputComponentName
    )

    const template = generateTemplate(
      path.join('scaffold', 'components', component),
      {
        name,
        columns,
        editableColumns,
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
  files: async (args) => await files(args),
  routes: (args) => routes(args),
  generate: (args) => generate(args),
}
