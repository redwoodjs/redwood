import path from 'path'

import Listr from 'listr'
import pascalcase from 'pascalcase'
import { paramCase } from 'param-case'
import terminalLink from 'terminal-link'
import { ensurePosixPath } from '@redwoodjs/internal'

import { generateTemplate, getPaths, writeFilesTask } from 'src/lib'
import c from 'src/lib/colors'

import { yargsDefaults } from '../generate'

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
  const outputComponentName =
    componentName || pascalcase(paramCase(name)) + suffix
  const componentOutputPath =
    outputPath ||
    path.join(basePath, outputComponentName, outputComponentName + extension)
  const content = generateTemplate(
    path.join(generator, 'templates', templatePath),
    {
      name,
      outputPath: ensurePosixPath(
        `./${path.relative(getPaths().base, componentOutputPath)}`
      ),
      ...templateVars,
    }
  )
  return [componentOutputPath, content]
}

/**
 * Creates a route path, either returning the existing path if passed, otherwise
 * creates one based on the name
 */
export const pathName = (path, name) => {
  return path ?? `/${paramCase(name)}`
}

/**
 * Reduces boilerplate for creating a yargs handler that writes a component to a
 * location.
 */
// TODO: Make this work for all files, not just components.
export const createYargsForComponentGeneration = ({
  componentName,
  filesFn,
  builderObj = yargsDefaults,
}) => {
  return {
    command: `${componentName} <name>`,
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
      Object.entries(builderObj).forEach(([option, config]) => {
        yargs.option(option, config)
      })
    },
    handler: async (options) => {
      const tasks = new Listr(
        [
          {
            title: `Generating ${componentName} files...`,
            task: async () => {
              const f = await filesFn(options)
              return writeFilesTask(f, { overwriteExisting: options.force })
            },
          },
        ],
        { collapse: false, exitOnError: true }
      )

      try {
        await tasks.run()
      } catch (e) {
        console.log(c.error(e.message))
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
