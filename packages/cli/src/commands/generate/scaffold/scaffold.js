import fs from 'fs'
import path from 'path'

import camelcase from 'camelcase'
import humanize from 'humanize-string'
import Listr from 'listr'
import { paramCase } from 'param-case'
import pascalcase from 'pascalcase'
import terminalLink from 'terminal-link'

import { getConfig, generate as generateTypes } from '@redwoodjs/internal'

import {
  generateTemplate,
  readFile,
  writeFile,
  asyncForEach,
  getDefaultArgs,
  getPaths,
  writeFilesTask,
  addRoutesToRouterTask,
  addScaffoldImport,
  transformTSToJS,
} from '../../../lib'
import c from '../../../lib/colors'
import { pluralize, singularize } from '../../../lib/rwPluralize'
import { getSchema, verifyModelName } from '../../../lib/schemaHelpers'
import { yargsDefaults } from '../../generate'
import {
  customOrDefaultTemplatePath,
  relationsForModel,
  intForeignKeysForModel,
  mapPrismaScalarToPagePropTsType,
} from '../helpers'
import { files as sdlFiles, builder as sdlBuilder } from '../sdl/sdl'
import {
  files as serviceFiles,
  builder as serviceBuilder,
} from '../service/service'

// note a better way to do this is in https://github.com/redwoodjs/redwood/pull/3783/files
const NON_EDITABLE_COLUMNS = ['id', 'createdAt', 'updatedAt']
// Any assets that should not trigger an overwrite error and require a --force
const SKIPPABLE_ASSETS = ['scaffold.css']
const PACKAGE_SET = 'Set'

const getIdType = (model) => {
  return model.fields.find((field) => field.isId)?.type
}

const getImportComponentNames = (
  name,
  scaffoldPath,
  nestScaffoldByModel = true
) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(singularize(name))
  let componentPath
  let layoutPath
  if (scaffoldPath === '') {
    componentPath = nestScaffoldByModel
      ? `src/components/${singularName}`
      : `src/components`
    layoutPath = `src/layouts`
  } else {
    const sP = scaffoldPath.split('/').map(pascalcase).join('/')
    componentPath = nestScaffoldByModel
      ? `src/components/${sP}/${singularName}`
      : `src/components/${sP}`
    layoutPath = `src/layouts/${sP}`
  }

  return {
    importComponentName: `${componentPath}/${singularName}`,
    importComponentNameCell: `${componentPath}/${singularName}Cell`,
    importComponentEditNameCell: `${componentPath}/Edit${singularName}Cell`,
    importComponentNameForm: `${componentPath}/${singularName}Form`,
    importComponentNewName: `${componentPath}/New${singularName}`,
    importComponentNames: `${componentPath}/${pluralName}`,
    importComponentNamesCell: `${componentPath}/${pluralName}Cell`,
    importLayoutNames: `${layoutPath}/${pluralName}Layout`,
  }
}

// Includes imports from getImportComponentNames()
const getTemplateStrings = (name, scaffoldPath, nestScaffoldByModel = true) => {
  const pluralPascalName = pascalcase(pluralize(name))
  const singularPascalName = pascalcase(singularize(name))

  const pluralCamelName = camelcase(pluralPascalName)
  const singularCamelName = camelcase(singularPascalName)
  const camelScaffoldPath = camelcase(pascalcase(scaffoldPath))

  return {
    pluralRouteName:
      scaffoldPath === ''
        ? pluralCamelName
        : `${camelScaffoldPath}${pluralPascalName}`,

    editRouteName:
      scaffoldPath === ''
        ? `edit${singularPascalName}`
        : `${camelScaffoldPath}Edit${singularPascalName}`,

    singularRouteName:
      scaffoldPath === ''
        ? singularCamelName
        : `${camelScaffoldPath}${singularPascalName}`,

    newRouteName:
      scaffoldPath === ''
        ? `new${singularPascalName}`
        : `${camelScaffoldPath}New${singularPascalName}`,
    ...getImportComponentNames(name, scaffoldPath, nestScaffoldByModel),
  }
}

// Checks whether Tailwind is installed, and if the `flag` argument is not
// already set, returns true. Otherwise just returns `flag`
export const shouldUseTailwindCSS = (flag) => {
  if (flag === undefined) {
    return fs.existsSync(path.join(getPaths().web.config, 'tailwind.config.js'))
  } else {
    return flag
  }
}

export const files = async ({
  model: name,
  path: scaffoldPath = '',
  tests = true,
  typescript = false,
  tailwind = false,
  nestScaffoldByModel,
}) => {
  const model = await getSchema(name)
  if (typeof nestScaffoldByModel === 'undefined') {
    nestScaffoldByModel = getConfig().generate.nestScaffoldByModel
  }
  const templateStrings = getTemplateStrings(
    name,
    scaffoldPath,
    nestScaffoldByModel
  )
  const pascalScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(pascalcase).join('/') + '/'

  return {
    ...(await componentFiles(
      name,
      pascalScaffoldPath,
      typescript,
      nestScaffoldByModel,
      templateStrings
    )),
    ...(await sdlFiles({
      ...getDefaultArgs(sdlBuilder),
      name,
      crud: true,
      typescript,
    })),
    ...(await serviceFiles({
      ...getDefaultArgs(serviceBuilder),
      name,
      crud: true,
      relations: relationsForModel(model),
      tests,
      typescript,
    })),
    ...assetFiles(name, tailwind),
    ...layoutFiles(name, pascalScaffoldPath, typescript, templateStrings),
    ...(await pageFiles(
      name,
      pascalScaffoldPath,
      typescript,
      nestScaffoldByModel,
      templateStrings
    )),
  }
}

const assetFiles = (name, tailwind) => {
  let fileList = {}
  const assets = fs.readdirSync(
    customOrDefaultTemplatePath({
      side: 'web',
      generator: 'scaffold',
      templatePath: 'assets',
    })
  )

  assets.forEach((asset) => {
    // check if the asset name matches the Tailwind preference
    if (
      (tailwind && asset.match(/tailwind/)) ||
      (!tailwind && !asset.match(/tailwind/))
    ) {
      const outputAssetName = asset
        .replace(/\.template/, '')
        .replace(/\.tailwind/, '')
      const outputPath = path.join(getPaths().web.src, outputAssetName)

      // skip assets that already exist on disk, never worry about overwriting
      if (
        !SKIPPABLE_ASSETS.includes(path.basename(outputPath)) ||
        !fs.existsSync(outputPath)
      ) {
        const template = generateTemplate(
          customOrDefaultTemplatePath({
            side: 'web',
            generator: 'scaffold',
            templatePath: path.join('assets', asset),
          }),
          {
            name,
          }
        )
        fileList[outputPath] = template
      }
    }
  })

  return fileList
}

const layoutFiles = (
  name,
  pascalScaffoldPath = '',
  generateTypescript,
  templateStrings
) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(singularize(name))
  let fileList = {}

  const layouts = fs.readdirSync(
    customOrDefaultTemplatePath({
      side: 'web',
      generator: 'scaffold',
      templatePath: 'layouts',
    })
  )

  layouts.forEach((layout) => {
    const outputLayoutName = layout
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.tsx\.template/, generateTypescript ? '.tsx' : '.js')

    const outputPath = path.join(
      getPaths().web.layouts,
      pascalScaffoldPath,
      outputLayoutName.replace(/\.(js|tsx?)/, ''),
      outputLayoutName
    )
    const template = generateTemplate(
      customOrDefaultTemplatePath({
        side: 'web',
        generator: 'scaffold',
        templatePath: path.join('layouts', layout),
      }),
      {
        name,
        pascalScaffoldPath,
        ...templateStrings,
      }
    )

    fileList[outputPath] = generateTypescript
      ? template
      : transformTSToJS(outputPath, template)
  })

  return fileList
}

const pageFiles = async (
  name,
  pascalScaffoldPath = '',
  generateTypescript,
  nestScaffoldByModel = true,
  templateStrings
) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(singularize(name))
  const model = await getSchema(singularName)
  const idType = getIdType(model)
  const idTsType = mapPrismaScalarToPagePropTsType(idType)

  let fileList = {}

  const pages = fs.readdirSync(
    customOrDefaultTemplatePath({
      side: 'web',
      generator: 'scaffold',
      templatePath: 'pages',
    })
  )

  pages.forEach((page) => {
    // Sanitize page names
    const outputPageName = page
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.tsx\.template/, generateTypescript ? '.tsx' : '.js')

    const finalFolder =
      (nestScaffoldByModel ? singularName + '/' : '') +
      outputPageName.replace(/\.(js|tsx?)/, '')

    const outputPath = path.join(
      getPaths().web.pages,
      pascalScaffoldPath,
      finalFolder,
      outputPageName
    )
    const template = generateTemplate(
      customOrDefaultTemplatePath({
        side: 'web',
        generator: 'scaffold',
        templatePath: path.join('pages', page),
      }),
      {
        idTsType,
        name,
        pascalScaffoldPath,
        ...templateStrings,
      }
    )

    fileList[outputPath] = generateTypescript
      ? template
      : transformTSToJS(outputPath, template)
  })

  return fileList
}

const componentFiles = async (
  name,
  pascalScaffoldPath = '',
  generateTypescript,
  nestScaffoldByModel = true,
  templateStrings
) => {
  const pluralName = pascalcase(pluralize(name))
  const singularName = pascalcase(singularize(name))
  const model = await getSchema(singularName)
  const idType = getIdType(model)
  const intForeignKeys = intForeignKeysForModel(model)
  let fileList = {}
  const componentMetadata = {
    Enum: {
      componentName: 'RadioField',
      defaultProp: 'defaultChecked',
      validation: () => false,
      listDisplayFunction: 'formatEnum',
      displayFunction: 'formatEnum',
    },
    EnumList: {
      componentName: 'CheckboxField',
      defaultProp: 'defaultChecked',
      validation: () => false,
      listDisplayFunction: 'formatEnum',
      displayFunction: 'formatEnum',
    },
    Boolean: {
      componentName: 'CheckboxField',
      defaultProp: 'defaultChecked',
      validation: () => false,
      listDisplayFunction: 'checkboxInputTag',
      displayFunction: 'checkboxInputTag',
    },
    DateTime: {
      componentName: 'DatetimeLocalField',
      deserializeFunction: 'formatDatetime',
      listDisplayFunction: 'timeTag',
      displayFunction: 'timeTag',
    },
    Int: {
      componentName: 'NumberField',
    },
    Json: {
      componentName: 'TextAreaField',
      validation: (isRequired) =>
        `{{ valueAsJSON: true${isRequired ? ', required: true' : ''} }}`,
      displayFunction: 'jsonDisplay',
      listDisplayFunction: 'jsonTruncate',
      deserializeFunction: 'JSON.stringify',
    },
    Float: {
      validation: (isRequired) =>
        `{{ valueAsNumber: true${isRequired ? ', required: true' : ''} }}`,
    },
    Decimal: {
      validation: (isRequired) =>
        `{{ valueAsNumber: true${isRequired ? ', required: true' : ''} }}`,
    },
    default: {
      componentName: 'TextField',
      defaultProp: 'defaultValue',
      deserializeFunction: '',
      validation: '{{ required: true }}',
      displayFunction: undefined,
      listDisplayFunction: 'truncate',
    },
  }

  const columns = model.fields
    .filter((field) => field.kind !== 'object')
    .map((column) => {
      let validation

      if (componentMetadata[column.type]?.validation) {
        validation = componentMetadata[column.type]?.validation(
          column?.isRequired
        )
      } else {
        validation = column?.isRequired
          ? componentMetadata.default.validation
          : null
      }

      const isEnum = column.kind === 'enum'
      const isList = column.isList
      const enumType = isEnum && isList ? 'EnumList' : 'Enum'
      const metadataKey = isEnum ? enumType : column.type

      return {
        ...column,
        label: humanize(column.name),
        component:
          componentMetadata[metadataKey]?.componentName ||
          componentMetadata.default.componentName,
        defaultProp:
          componentMetadata[metadataKey]?.defaultProp ||
          componentMetadata.default.defaultProp,
        deserializeFunction:
          componentMetadata[metadataKey]?.deserializeFunction ||
          componentMetadata.default.deserializeFunction,
        validation,
        listDisplayFunction:
          componentMetadata[metadataKey]?.listDisplayFunction ||
          componentMetadata.default.listDisplayFunction,
        displayFunction:
          componentMetadata[metadataKey]?.displayFunction ||
          componentMetadata.default.displayFunction,
        values: column.enumValues || [],
        isList,
        isEnum,
      }
    })
  const editableColumns = columns.filter((column) => {
    return NON_EDITABLE_COLUMNS.indexOf(column.name) === -1
  })
  const fieldsToImport = Object.keys(
    editableColumns.reduce((accumulator, column) => {
      accumulator[column.component] = true
      return accumulator
    }, {})
  )

  if (!fieldsToImport.length) {
    throw new Error(`There are no editable fields in the ${name} model`)
  }

  const components = fs.readdirSync(
    customOrDefaultTemplatePath({
      side: 'web',
      generator: 'scaffold',
      templatePath: 'components',
    })
  )

  await asyncForEach(components, (component) => {
    const outputComponentName = component
      .replace(/Names/, pluralName)
      .replace(/Name/, singularName)
      .replace(/\.tsx\.template/, generateTypescript ? '.tsx' : '.js')

    const finalFolder =
      (nestScaffoldByModel ? singularName + '/' : '') +
      outputComponentName.replace(/\.(js|tsx?)/, '')

    const outputPath = path.join(
      getPaths().web.components,
      pascalScaffoldPath,
      finalFolder,
      outputComponentName
    )

    const template = generateTemplate(
      customOrDefaultTemplatePath({
        side: 'web',
        generator: 'scaffold',
        templatePath: path.join('components', component),
      }),
      {
        name,
        columns,
        fieldsToImport,
        editableColumns,
        idType,
        intForeignKeys,
        pascalScaffoldPath,
        ...templateStrings,
      }
    )

    fileList[outputPath] = generateTypescript
      ? template
      : transformTSToJS(outputPath, template)
  })

  return fileList
}

// add routes for all pages
export const routes = async ({
  model: name,
  path: scaffoldPath = '',
  nestScaffoldByModel,
}) => {
  if (typeof nestScaffoldByModel === 'undefined') {
    nestScaffoldByModel = getConfig().generate.nestScaffoldByModel
  }

  const templateNames = getTemplateStrings(name, scaffoldPath)
  const singularPascalName = pascalcase(singularize(name))
  const pluralPascalName = pascalcase(pluralize(name))
  const pluralParamName = paramCase(pluralPascalName)
  const model = await getSchema(singularPascalName)
  const idRouteParam = getIdType(model) === 'Int' ? ':Int' : ''

  const paramScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(paramCase).join('/') + '/'
  const pascalScaffoldPath = pascalcase(scaffoldPath)

  const pageRoot =
    pascalScaffoldPath + (nestScaffoldByModel ? singularPascalName : '')

  return [
    // new
    `<Route path="/${paramScaffoldPath}${pluralParamName}/new" page={${pageRoot}New${singularPascalName}Page} name="${templateNames.newRouteName}" />`,
    // edit
    `<Route path="/${paramScaffoldPath}${pluralParamName}/{id${idRouteParam}}/edit" page={${pageRoot}Edit${singularPascalName}Page} name="${templateNames.editRouteName}" />`,
    // singular
    `<Route path="/${paramScaffoldPath}${pluralParamName}/{id${idRouteParam}}" page={${pageRoot}${singularPascalName}Page} name="${templateNames.singularRouteName}" />`,
    // plural
    `<Route path="/${paramScaffoldPath}${pluralParamName}" page={${pageRoot}${pluralPascalName}Page} name="${templateNames.pluralRouteName}" />`,
  ]
}

const addRoutesInsideSetToRouter = async (model, path) => {
  const pluralPascalName = pascalcase(pluralize(model))
  const layoutName = `${pluralPascalName}Layout`
  return addRoutesToRouterTask(await routes({ model, path }), layoutName)
}

const addLayoutImport = ({ model: name, path: scaffoldPath = '' }) => {
  const pluralPascalName = pascalcase(pluralize(name))
  const pascalScaffoldPath =
    scaffoldPath === ''
      ? scaffoldPath
      : scaffoldPath.split('/').map(pascalcase).join('/') + '/'
  const layoutName = `${pluralPascalName}Layout`
  const importLayout = `import ${pluralPascalName}Layout from 'src/layouts/${pascalScaffoldPath}${layoutName}'`
  const routesPath = getPaths().web.routes
  const routesContent = readFile(routesPath).toString()

  if (!routesContent.match(importLayout)) {
    const newRoutesContent = routesContent.replace(
      /['"]@redwoodjs\/router['"](\s*)/,
      `'@redwoodjs/router'\n${importLayout}$1`
    )
    writeFile(routesPath, newRoutesContent, { overwriteExisting: true })

    return 'Added layout import to Routes.{js,tsx}'
  } else {
    return 'Layout import already exists in Routes.{js,tsx}'
  }
}

const addSetImport = (task) => {
  const routesPath = getPaths().web.routes
  const routesContent = readFile(routesPath).toString()
  const [redwoodRouterImport, importStart, spacing, importContent, importEnd] =
    routesContent.match(
      /(import {)(\s*)([^]*)(} from ['"]@redwoodjs\/router['"])/
    ) || []

  if (!redwoodRouterImport) {
    task.skip(
      "Couldn't add Set import from @redwoodjs/router to Routes.{js,tsx}"
    )
    return undefined
  }

  const routerImports = importContent.replace(/\s/g, '').split(',')
  if (routerImports.includes(PACKAGE_SET)) {
    return 'Skipping Set import'
  }
  const newRoutesContent = routesContent.replace(
    redwoodRouterImport,
    importStart +
      spacing +
      PACKAGE_SET +
      `,` +
      spacing +
      importContent +
      importEnd
  )

  writeFile(routesPath, newRoutesContent, { overwriteExisting: true })

  return 'Added Set import to Routes.{js,tsx}'
}

export const command = 'scaffold <model>'
export const description =
  'Generate Pages, SDL, and Services files based on a given DB schema Model. Also accepts <path/model>'
export const builder = (yargs) => {
  yargs
    .positional('model', {
      description:
        "Model to scaffold. You can also use <path/model> to nest files by type at the given path directory (or directories). For example, 'rw g scaffold admin/post'",
    })
    .option('tests', {
      description: 'Generate test files',
      type: 'boolean',
    })
    .option('tailwind', {
      description:
        'Generate TailwindCSS version of scaffold.css (automatically set to `true` if TailwindCSS config exists)',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/reference/command-line-interface#generate-scaffold'
      )}`
    )

  // Merge generator defaults in
  Object.entries(yargsDefaults).forEach(([option, config]) => {
    yargs.option(option, config)
  })
}
export const tasks = ({
  model,
  path,
  force,
  tests,
  typescript,
  javascript,
  tailwind,
}) => {
  return new Listr(
    [
      {
        title: 'Generating scaffold files...',
        task: async () => {
          const f = await files({
            model,
            path,
            tests,
            typescript,
            javascript,
            tailwind,
          })
          return writeFilesTask(f, { overwriteExisting: force })
        },
      },
      {
        title: 'Adding layout import...',
        task: async () => addLayoutImport({ model, path }),
      },
      {
        title: 'Adding set import...',
        task: async (_, task) => addSetImport(task),
      },
      {
        title: 'Adding scaffold routes...',
        task: async () => addRoutesInsideSetToRouter(model, path),
      },
      {
        title: 'Adding scaffold asset imports...',
        task: () => addScaffoldImport(),
      },
      {
        title: `Generating types ...`,
        task: generateTypes,
      },
    ],
    { collapse: false, exitOnError: true }
  )
}

export const handler = async ({
  model: modelArg,
  force,
  tests,
  typescript,
  tailwind,
}) => {
  if (tests === undefined) {
    tests = getConfig().generate.tests
  }
  const { model, path } = splitPathAndModel(modelArg)

  tailwind = shouldUseTailwindCSS(tailwind)

  try {
    const { name } = await verifyModelName({ name: model })
    const t = tasks({
      model: name,
      path,
      force,
      tests,
      typescript,
      tailwind,
    })
    await t.run()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(e?.existCode || 1)
  }
}

export const splitPathAndModel = (pathSlashModel) => {
  const path = pathSlashModel.split('/').slice(0, -1).join('/')
  // This code will work whether or not there's a path in model
  // E.g. if model is just 'post',
  // path.split('/') will return ['post'].
  const model = pathSlashModel.split('/').pop()

  return { model, path }
}
