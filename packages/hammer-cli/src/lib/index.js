import fs from 'fs'
import path from 'path'

import requireDir from 'require-dir'
import parse from 'yargs-parser'
import { getHammerConfig } from '@hammerframework/hammer-core'
import lodash from 'lodash/string'

export const templateRoot = path.join(__dirname, '..', '..', 'src', 'commands', 'Generate', 'templates')

export const generateTemplate = (templateFilename, replacements) => {
  const templatePath = path.join(templateRoot, templateFilename)
  const template = lodash.template(readFile(templatePath).toString())

  return template(replacements)
}

export const readFile = target => fs.readFileSync(target)

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

export const hammerBaseDir = () => getHammerConfig().baseDir

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

export const parseArgs = () => {
  return parse(process.argv.slice(2))._
}
