import fs from 'fs'
import path from 'path'

import requireDir from 'require-dir'
import parse from 'yargs-parser'
import lodash from 'lodash/string'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { paramCase } from 'param-case'

// Returns variants of the passed `name` for usage in templates. If the given
// name was "fooBar" then these would be:
//
//   pascalName: FooBar
//   singularPascalName: FooBar
//   pluralPascalName: FooBars
//   singularCamelName: fooBar
//   pluralCamelName: fooBars
//   singularParamName: foo-bar
//   pluralParamName: foo-bars

const nameVariants = (name) => {
  const normalizedName = pascalcase(pluralize.singular(name))

  return {
    pascalName: pascalcase(name),
    singularPascalName: normalizedName,
    pluralPascalName: pluralize(normalizedName),
    singularCamelName: camelcase(normalizedName),
    pluralCamelName: camelcase(pluralize(normalizedName)),
    singularParamName: paramCase(normalizedName),
    pluralParamName: paramCase(pluralize(normalizedName)),
  }
}

export const templateRoot = path.join(
  __dirname,
  '..',
  '..',
  'src',
  'commands',
  'Generate',
  'templates'
)

export const generateTemplate = (templateFilename, vars) => {
  const templatePath = path.join(templateRoot, templateFilename)
  const template = lodash.template(readFile(templatePath).toString())
  const replacements = Object.assign(vars, nameVariants(vars.name))

  return template(replacements)
}

export const readFile = (target) => fs.readFileSync(target)

export const writeFile = (
  target,
  contents,
  { overwriteExisting = false } = {}
) => {
  if (overwriteExisting === false) {
    if (fs.existsSync(target)) {
      throw `${target} already exists`
    }
  }
  const filename = path.basename(target)
  const targetDir = target.replace(filename, '')
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(target, contents)
}

export const bytes = (contents) => Buffer.byteLength(contents, 'utf8')

const validateCommandExports = ({ commandProps, ...rest }) => {
  if (typeof rest.default !== 'function') {
    throw 'you must export a default function'
  }

  if (!commandProps) {
    throw 'you must export an object called `commandProps`'
  }

  const { description } = commandProps
  if (!description) {
    throw 'you must add a `description` to  your `commandProps`'
  }
}

// TODO: Throw on duplicate commands
export const getCommands = (commandsPath = '../commands') => {
  const foundCommands = requireDir(commandsPath, {
    recurse: true,
    extensions: ['.js'],
    filter: (fullPath) => {
      return fullPath.indexOf('.test.js') === -1
    },
  })

  return Object.keys(foundCommands).reduce((newCommands, commandName) => {
    let command = foundCommands[commandName]
    // is this a directory-named-modules? Eg: `/Generate/Generate.js`
    // NOTE: Improve this by looking at the file names before importing
    // everything.
    if (command.index && command.index.default) {
      command = command.index
    } else if (command[commandName] && command[commandName].default) {
      command = command[commandName]
    }

    try {
      validateCommandExports(command)
    } catch (e) {
      throw `your "${commandName}" command is not exporting the correct requirements: ${e}`
    }

    const { commandProps, ...rest } = command
    const newCommandProps = {
      name: commandProps.name || commandName,
      ...commandProps,
    }

    return [...newCommands, { commandProps: newCommandProps, ...rest }]
  }, [])
}

// turns command line args like:
//
//   generate sdl contact--force
//
// into:
//
//   [['generate', 'sdl', 'contact'], { force: true }]
export const parseArgs = () => {
  const parsed = parse(process.argv.slice(2))
  const { _: positional, ...flags } = parsed

  return [positional, flags]
}
