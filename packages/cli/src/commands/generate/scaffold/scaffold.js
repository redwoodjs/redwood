import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { paramCase } from 'param-case'
import humanize from 'humanize-string'

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

import { relationsForModel, intForeignKeysForModel } from '../helpers'
import { files as sdlFiles } from '../sdl/sdl'
import { files as serviceFiles } from '../service/service'

const NON_EDITABLE_COLUMNS = ['id', 'createdAt', 'updatedAt']
const ASSETS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'assets')
)
const LAYOUTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'layouts')
)
const PAGES = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'pages')
)
const COMPONENTS = fs.readdirSync(
  path.join(templateRoot, 'scaffold', 'templates', 'components')
)
const SCAFFOLD_STYLE_PATH = './scaffold.css'
// Any assets that should not trigger an overwrite error and require a --force
const SKIPPABLE_ASSETS = ['scaffold.css']

const getIdType = (model) => {
  return model.fields.find((field) => field.isId)?.type
}

export const files = async ({ model: name }) => {
  const model = await getSchema(pascalcase(pluralize.singular(name)))

  return {
    ...(await sdlFiles({ name, crud: true })),
    ...(await serviceFiles({
      name,
      crud: true,
      relations: relationsForModel(model),
    })),
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

    // skip assets that already exist on disk, never worry about overwriting
    if (
      !SKIPPABLE_ASSETS.includes(path.basename(outputPath)) ||
      !fs.existsSync(outputPath)
    ) {
      const template = generateTemplate(
        path.join('scaffold', 'templates', 'assets', asset),
        {
          name,
        }
      )
      fileList[outputPath] = template
    }
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
      path.join('scaffold', 'templates', 'layouts', layout),
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
    const template = generateTemplate(
      path.join('scaffold', 'templates', 'pages', page),
      {
        name,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

const componentFiles = async (name) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(pluralize.singular(name))
  const model = await getSchema(singularName)
  const idType = getIdType(model)
  const columns = model.fields.filter((field) => field.kind !== 'object')
  const intForeignKeys = intForeignKeysForModel(model)
  let fileList = {}
  const editableColumns = columns
    .filter((column) => {
      return NON_EDITABLE_COLUMNS.indexOf(column.name) === -1
    })
    .map((column) => ({
      ...column,
      label: humanize(column.name),
    }))

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
      path.join('scaffold', 'templates', 'components', component),
      {
        name,
        columns,
        editableColumns,
        idType,
        intForeignKeys,
      }
    )
    fileList[outputPath] = template
  })

  return fileList
}

// add routes for all pages
export const routes = async ({ model: name }) => {
  const singularPascalName = pascalcase(pluralize.singular(name))
  const pluralPascalName = pascalcase(pluralize(name))
  const singularCamelName = camelcase(singularPascalName)
  const pluralCamelName = camelcase(pluralPascalName)
  const pluralParamName = paramCase(pluralPascalName)
  const model = await getSchema(singularPascalName)
  const idRouteParam = getIdType(model) === 'Int' ? ':Int' : ''

  return [
    `<Route path="/${pluralParamName}/new" page={New${singularPascalName}Page} name="new${singularPascalName}" />`,
    `<Route path="/${pluralParamName}/{id${idRouteParam}}/edit" page={Edit${singularPascalName}Page} name="edit${singularPascalName}" />`,
    `<Route path="/${pluralParamName}/{id${idRouteParam}}" page={${singularPascalName}Page} name="${singularCamelName}" />`,
    `<Route path="/${pluralParamName}" page={${pluralPascalName}Page} name="${pluralCamelName}" />`,
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
    { collapse: false, exitOnError: true }
  )
  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}
