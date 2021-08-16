import path from 'path'

import Listr from 'listr'
import { paramCase } from 'param-case'
import pascalcase from 'pascalcase'
import terminalLink from 'terminal-link'

import { getConfig, ensurePosixPath } from '@redwoodjs/internal'

import {
  generateTemplate,
  getPaths,
  transformTSToJS,
  writeFilesTask,
} from '../../../lib'
import c from '../../../lib/colors'
import { yargsDefaults } from '../../generate'

const REDWOOD_WEB_PATH_NAME = 'components'

export const templateForCellStateComponentFile = ({
  name,
  suffix = '',
  extension = '.js',
  webPathSection,
  apiPathSection,
  generator,
  templatePath,
  templateVars,
  componentName,
  outputPath = 'CellStates',
}) => {
  const basePath = webPathSection
    ? getPaths().web[webPathSection]
    : getPaths().api[apiPathSection]
  const outputComponentName =
    componentName || pascalcase(paramCase(name)) + suffix
  const componentOutputPath = path.join(
    basePath,
    outputPath,
    outputComponentName,
    outputComponentName + extension
  )
  const fullTemplatePath = path.join(generator, 'templates', templatePath)

  const setupTemplatesRoot = path.resolve(__dirname, '../../setup')

  const content = generateTemplate(fullTemplatePath, {
    name,
    root: setupTemplatesRoot,
    outputPath: ensurePosixPath(
      `./${path.relative(getPaths().base, componentOutputPath)}`
    ),
    ...templateVars,
  })

  return [componentOutputPath, content]
}

export const files = ({ typescript = false, ...options }) => {
  let files = []
  let states = []

  if (options.empty) {
    states.push('empty')
  }
  if (options.failure) {
    states.push('failure')
  }
  if (options.loading) {
    states.push('loading')
  }

  states.forEach((name) => {
    const extension = typescript ? '.tsx' : '.js'
    const componentFile = templateForCellStateComponentFile({
      name,
      componentName: pascalcase(name + 'State'),
      webPathSection: REDWOOD_WEB_PATH_NAME,
      extension,
      generator: 'cellStates',
      templatePath: `${name}/${name}.component.tsx.template`,
    })
    const testFile = templateForCellStateComponentFile({
      name,
      componentName: pascalcase(name + 'State'),
      extension: `.test${extension}`,
      webPathSection: REDWOOD_WEB_PATH_NAME,
      generator: 'cellStates',
      templatePath: `${name}/${name}.test.tsx.template`,
    })
    const storiesFile = templateForCellStateComponentFile({
      name,
      componentName: pascalcase(name + 'State'),
      extension: `.stories${extension}`,
      webPathSection: REDWOOD_WEB_PATH_NAME,
      generator: 'cellStates',
      templatePath: `${name}/${name}.stories.tsx.template`,
    })

    files.push(componentFile)

    if (options.stories) {
      files.push(storiesFile)
    }

    if (options.tests) {
      files.push(testFile)
    }
  })

  // Returns
  // {
  //    "path/to/fileA": "<<<template>>>",
  //    "path/to/fileB": "<<<template>>>",
  // }
  return files.reduce((acc, [outputPath, content]) => {
    const template = typescript ? content : transformTSToJS(outputPath, content)

    return {
      [outputPath]: template,
      ...acc,
    }
  }, {})
}

export const description = 'Generate a cell state component'

export const createYargsForCellStateComponentGeneration = ({
  filesFn,
  optionsObj = yargsDefaults,
  includeAdditionalTasks = () => [], // function that takes the options object and returns an array of listr tasks
}) => {
  return {
    command: 'cell-states',
    description: `Generate Cell State components fro Loading, Empty, and Failure`,
    builder: (yargs) => {
      yargs

        .epilogue(
          `Also see the ${terminalLink(
            'Redwood CLI Reference',
            `https://redwoodjs.com/reference/command-line-interface#setup-cell-states`
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

      //Add in passed in options
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

      const tasks = new Listr(
        [
          {
            title: `Generating Cell State component files...`,
            task: async () => {
              const f = await filesFn(options)
              return writeFilesTask(f, { overwriteExisting: options.force })
            },
          },
          ...includeAdditionalTasks(options),
        ],
        { collapse: false, exitOnError: true }
      )

      try {
        await tasks.run()
      } catch (e) {
        console.error(c.error(e.message))
        process.exit(e?.exitCode || 1)
      }
    },
  }
}

export const { command, builder, handler } =
  createYargsForCellStateComponentGeneration({
    commandName: 'cell-states',
    filesFn: files,
    optionsObj: {
      ...yargsDefaults,
      empty: {
        alias: 'e',
        default: true,
        description:
          'Use when you want to generate an Empty cell state component',
        type: 'boolean',
      },
      failure: {
        alias: 'fail',
        default: true,
        description:
          'Use when you want to generate a Failure cell state component',
        type: 'boolean',
      },
      loading: {
        alias: 'l',
        default: true,
        description:
          'Use when you want to generate a Loading cell state component',
        type: 'boolean',
      },
    },
  })
