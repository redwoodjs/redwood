import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import {
  generateTemplate,
  templateRoot,
  readFile,
  writeFile,
  asyncForEach,
  getSchema,
  getPaths,
  writeFilesTask,
  addRoutesToRouterTask,
} from 'src/lib'
import c from 'src/lib/colors'

import { files as sdlFiles } from './sdl'
import { files as serviceFiles } from './service'

const NON_EDITABLE_COLUMNS = ['id', 'createdAt', 'updatedAt']
const ASSETS = fs.readdirSync(path.join(templateRoot, 'scaffold', 'assets'))
const LAYOUTS = fs.readdirSync(path.join(templateRoot, 'scaffold', 'layouts'))
const PAGES = fs.readdirSync(path.join(templateRoot, 'scaffold', 'pages'))
const COMPONENTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'components')
)
const SCAFFOLD_STYLE_PATH = './scaffold.css'

const getIdType = (model) => {
  return model.fields.find((field) => field.name === 'id')?.type
}

export const files = async ({ model: name }) => {
  return {
    ...(await sdlFiles({ name, crud: true })),
    ...(await serviceFiles({ name, crud: true })),
    ...assetFiles(name),
    ...layoutFiles(name),
    ...pageFiles(name),
    ...(await componentFiles(name)),
  }
}

const assetFiles = (name) => {
  let fileList = {}

  ASSETS.forEach((asset) => {
    const outputAssetName = asset.replace(/\.template/, '')
    const outputPath = path.join(getPaths().web.src, outputAssetName)
    const template = generateTemplate(path.join('scaffold', 'assets', asset), {
      name,
    })
    fileList[outputPath] = template
  })

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
  const model = await getSchema(singularName)
  const idType = getIdType(model)
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
        idType,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

// add routes for all pages
const routes = async ({ model: name }) => {
  const singularPascalName = pascalcase(pluralize.singular(name))
  const pluralPascalName = pascalcase(pluralize(name))
  const singularCamelName = camelcase(singularPascalName)
  const pluralCamelName = camelcase(pluralPascalName)
  const model = await getSchema(singularPascalName)
  const idRouteParam = getIdType(model) === 'Int' ? ':Int' : ''

  return [
    `<Route path="/${pluralCamelName}/{id${idRouteParam}}/edit" page={Edit${singularPascalName}Page} name="edit${singularPascalName}" />`,
    `<Route path="/${pluralCamelName}/new" page={New${singularPascalName}Page} name="new${singularPascalName}" />`,
    `<Route path="/${pluralCamelName}/{id${idRouteParam}}" page={${singularPascalName}Page} name="${singularCamelName}" />`,
    `<Route path="/${pluralCamelName}" page={${pluralPascalName}Page} name="${pluralCamelName}" />`,
  ]
}

const addScaffoldImport = () => {
  const indexJsPath = path.join(getPaths().web.src, 'index.js')
  let indexJsContents = readFile(indexJsPath).toString()

  if (indexJsContents.match(SCAFFOLD_STYLE_PATH)) {
    return 'Skipping scaffold style include'
  }

  indexJsContents = indexJsContents.replace(
    "import Routes from 'src/Routes'\n",
    `import Routes from 'src/Routes'\n\nimport '${SCAFFOLD_STYLE_PATH}'`
  )
  writeFile(indexJsPath, indexJsContents, { overwriteExisting: true })

  return 'Added scaffold import to index.js'
}

export const command = 'scaffold <model>'
export const desc = 'Generate pages, SDL, and a services object.'
export const builder = {
  force: { type: 'boolean', default: false },
}
export const handler = async ({ model, force }) => {
  const tasks = new Listr(
    [
      {
        title: 'Generating scaffold files...',
        task: async () => {
          const f = await files({ model })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
      {
        title: 'Adding scaffold routes...',
        task: async () => {
          return addRoutesToRouterTask(await routes({ model }))
        },
      },
      {
        title: 'Adding scaffold asset imports...',
        task: () => addScaffoldImport(),
      },
    ],
    { collapse: false }
  )
  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
