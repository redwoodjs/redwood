import path from 'path'

import Listr from 'listr'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'

import { generateTemplate, getPaths, writeFilesTask } from 'src/lib'

/**
 * Reduces boilerplate for generating an output path and content to write to disk
 * for a component.
 */
// TODO: Make this read all the files in a template directory.
export const templateForComponentFile = ({
  name,
  suffix = '',
  extension = '.js',
  webPathSection,
  templatePath,
  templateVars,
}) => {
  const basePath = getPaths().web[webPathSection]
  const componentName = pascalcase(pluralize.singular(name)) + suffix
  const outputPath = path.join(
    basePath,
    componentName,
    componentName + extension
  )
  const content = generateTemplate(templatePath, { name, ...templateVars })
  return [outputPath, content]
}

/**
 * Reduces boilerplate for creating a yargs handler that writes a component to a
 * location.
 */
export const createYargsForComponentGeneration = ({
  componentName,
  filesFn,
}) => {
  return {
    command: `${componentName} <name>`,
    desc: `Generate a ${componentName} component.`,
    builder: { force: { type: 'boolean', default: false } },
    handler: async ({ force, ...rest }) => {
      console.log('yo yo yo')
      const tasks = new Listr(
        [
          {
            title: `Generating ${componentName} files...`,
            task: async () => {
              const f = await filesFn(rest)
              return writeFilesTask(f, { overwriteExisting: force })
            },
          },
        ],
        { collapse: false }
      )

      try {
        await tasks.run()
      } catch (e) {
        // do nothing
      }
    },
  }
}
