import fs from 'fs'
import path from 'path'

import Listr from 'listr'
import { paramCase } from 'param-case'
import pascalcase from 'pascalcase'
import terminalLink from 'terminal-link'

import { ensurePosixPath, getConfig } from '@redwoodjs/internal'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { generateTemplate, getPaths, writeFilesTask } from '../../lib'
import c from '../../lib/colors'
import { pluralize, isPlural, isSingular } from '../../lib/rwPluralize'
import { yargsDefaults } from '../generate'

/**
 * Returns the path to a custom generator template, if found in the app.
 * Otherwise the default Redwood template.
 */
export const customOrDefaultTemplatePath = ({
  side,
  generator,
  templatePath,
}) => {
  // default template for this generator: ./page/templates/page.tsx.template
  const defaultPath = path.join(__dirname, generator, 'templates', templatePath)

  // where a custom template *might* exist: /path/to/app/web/generators/page/page.tsx.template
  const customPath = path.join(
    getPaths()[side].generators,
    generator,
    templatePath
  )

  if (fs.existsSync(customPath)) {
    return customPath
  } else {
    return defaultPath
  }
}

/**
 * Reduces boilerplate for generating an output path and content to write to disk
 * for a component.
 */
// TODO: Make this read all the files in a template directory instead of
// manually passing in each file.
export const templateForComponentFile = ({
  name,
  suffix = '',
  extension = '.js',
  webPathSection,
  apiPathSection,
  generator,
  templatePath,
  templateVars,
  componentName,
  outputPath,
}) => {
  const basePath = webPathSection
    ? getPaths().web[webPathSection]
    : getPaths().api[apiPathSection]
  const outputComponentName = componentName || pascalcase(name) + suffix
  const componentOutputPath =
    outputPath ||
    path.join(basePath, outputComponentName, outputComponentName + extension)
  const fullTemplatePath = customOrDefaultTemplatePath({
    generator,
    templatePath,
    side: webPathSection ? 'web' : 'api',
  })
  const content = generateTemplate(fullTemplatePath, {
    name,
    outputPath: ensurePosixPath(
      `./${path.relative(getPaths().base, componentOutputPath)}`
    ),
    ...templateVars,
  })
  return [componentOutputPath, content]
}

/**
 * Creates a route path, either returning the existing path if passed, or
 * creating one based on the name. If the passed path is just a route parameter
 * a new path based on the name is created, with the parameter appended to it
 */
export const pathName = (path, name) => {
  let routePath = path

  if (path && path.startsWith('{') && path.endsWith('}')) {
    routePath = `/${paramCase(name)}/${path}`
  }

  if (!routePath) {
    routePath = `/${paramCase(name)}`
  }

  return routePath
}

const appendPositionalsToCmd = (commandString, positionalsObj) => {
  // Add positionals like `page <name>` + ` [path]` if specified
  if (Object.keys(positionalsObj).length > 0) {
    const positionalNames = Object.keys(positionalsObj)
      .map((positionalName) => `[${positionalName}]`)
      .join(' ')
    // Note space after command is important
    return `${commandString} ${positionalNames}`
  } else {
    return commandString
  }
}

/** @type {(name: string, generatorName: string) => string } **/
export function removeGeneratorName(name, generatorName) {
  // page -> Page
  const pascalComponentName = pascalcase(generatorName)

  // Replace 'Page' at the end of `name` with ''
  const coercedName = name.replace(new RegExp(pascalComponentName + '$'), '')

  return coercedName
}

/**
 * Reduces boilerplate for creating a yargs handler that writes a
 * component/page/layout/etc to a location.
 */
export const createYargsForComponentGeneration = ({
  componentName,
  preTasksFn = (options) => options,
  /** filesFn is not used if generator implements its own `handler` */
  filesFn = () => ({}),
  optionsObj = yargsDefaults,
  positionalsObj = {},
  /** function that takes the options object and returns an array of listr tasks */
  includeAdditionalTasks = () => [],
}) => {
  return {
    command: appendPositionalsToCmd(`${componentName} <name>`, positionalsObj),
    description: `Generate a ${componentName} component`,
    builder: (yargs) => {
      yargs
        .positional('name', {
          description: `Name of the ${componentName}`,
          type: 'string',
        })
        .epilogue(
          `Also see the ${terminalLink(
            'Redwood CLI Reference',
            `https://redwoodjs.com/reference/command-line-interface#generate-${componentName}`
          )}`
        )
        .option('tests', {
          description: 'Generate test files',
          type: 'boolean',
        })
        .option('stories', {
          description: 'Generate storybook files',
          type: 'boolean',
        })

      // Add in passed in positionals
      Object.entries(positionalsObj).forEach(([option, config]) => {
        yargs.positional(option, config)
      })
      // Add in passed in options
      Object.entries(optionsObj).forEach(([option, config]) => {
        yargs.option(option, config)
      })
    },
    handler: async (options) => {
      if (options.tests === undefined) {
        options.tests = getConfig().generate.tests
      }
      if (options.stories === undefined) {
        options.stories = getConfig().generate.stories
      }

      try {
        options = await preTasksFn(options)

        const tasks = new Listr(
          [
            {
              title: `Generating ${componentName} files...`,
              task: async () => {
                const f = await filesFn(options)
                return writeFilesTask(f, { overwriteExisting: options.force })
              },
            },
            ...includeAdditionalTasks(options),
          ],
          { collapse: false, exitOnError: true }
        )

        await tasks.run()
      } catch (e) {
        errorTelemetry(process.argv, e.message)
        console.error(c.error(e.message))
        process.exit(e?.exitCode || 1)
      }
    },
  }
}

// Returns all relations to other models
export const relationsForModel = (model) => {
  return model.fields
    .filter((f) => f.relationName)
    .map((field) => {
      return field.name
    })
}

// Returns only relations that are of datatype Int
export const intForeignKeysForModel = (model) => {
  return model.fields
    .filter((f) => f.name.match(/Id$/) && f.type === 'Int')
    .map((f) => f.name)
}

/**
 * Adds "List" to the end of words we can't pluralize
 */
export const forcePluralizeWord = (word) => {
  // If word is both plural and singular (like equipment), then append "List"
  if (isPlural(word) && isSingular(word)) {
    return pascalcase(`${word}_list`)
  }

  return pluralize(word)
}

/** @type {(paramType: 'Int' | 'Float' | 'Boolean' | 'String') => string } **/
export const mapRouteParamTypeToTsType = (paramType) => {
  const routeParamToTsType = {
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    String: 'string',
  }
  return routeParamToTsType[paramType] || 'unknown'
}

/** @type {(scalarType: 'String' | 'Boolean' | 'Int' | 'BigInt' | 'Float' | 'Decimal' | 'DateTime' ) => string } **/
export const mapPrismaScalarToPagePropTsType = (scalarType) => {
  const prismaScalarToTsType = {
    String: 'string',
    Boolean: 'boolean',
    Int: 'number',
    BigInt: 'number',
    Float: 'number',
    Decimal: 'number',
    DateTime: 'string',
  }
  return prismaScalarToTsType[scalarType] || 'unknown'
}
