import path from 'path'

import React from 'react'
import { Box, Text, Color } from 'ink'
import { getHammerBaseDir } from '@hammerframework/hammer-core'

import { readFile, writeFile, bytes } from 'src/lib'

import component from './generators/component'
import page from './generators/page'

/**
 * A generator is a function that takes a name and returns a list of filenames
 * and contents that should be written to the disk.
 */
const DEFAULT_GENERATORS = [component, page]
const ROUTE_PATH = './web/src/Routes.js'

const DEFAULT_SRC_DIR = () =>
  path.join(getHammerBaseDir(), './web/src/')

const Generate = ({
  args,
  generators = DEFAULT_GENERATORS,
  fileWriter = writeFile,
}) => {

  if (!getHammerBaseDir()) {
    return (
      <Color red>
        The `generate` command has to be run in your hammer project directory.
      </Color>
    )
  }

  const [
    _commandName,
    generatorCommand,
    name,
    targetDir = DEFAULT_SRC_DIR(),
  ] = args

  const generator = generators.find(generator => generator.command === generatorCommand)

  if (!generator || !name) {
    const generatorText = generators.map((generator, i) => {
      return (
        <Box key={i} marginLeft={1}>
          <Box width={12}>
            <Color yellow>{generator.command}</Color></Box>
          <Box>{generator.description}</Box>
        </Box>
      )
    })

    return (
      <>
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold>Usage</Text>
          </Box>
          <Text>
            hammer generate{' '}
            <Color blue>{generatorCommand || 'generator'} name [path]</Color>
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text bold underline>
            Available generators:
          </Text>
        </Box>
        { generatorText }
      </>
    )
  }

  let results = []

  // Generator found, do we need to create any files?

  if ('files' in generator) {
    const files = generator.files(args)
    results = results.concat(Object.keys(files).map((filename) => {
      const contents = files[filename]
      try {
        fileWriter(path.join(targetDir, filename), contents)
        return (
          <Text key={`wrote-${filename}`}>
            <Color green>Wrote {filename}</Color> {bytes(contents)} bytes
          </Text>
        )
      } catch (e) {
        return (
          <Text key={`error-${filename}`}>
            <Color red>{e}</Color>
          </Text>
        )
      }
    }))
  }

  // Do we need to append any routes?

  if ('routes' in generator) {
    console.info()
    const routeFile = readFile(ROUTE_PATH).toString()
    let newRouteFile = routeFile

    generator.routes(args).forEach(route => {
      newRouteFile = newRouteFile.replace(/(\s*)\<Router\>/, `$1<Router>$1  ${route}`)
    })

    fileWriter(path.join(ROUTE_PATH), newRouteFile, { overwriteExisting: true })

    results.push(
      <Text key="route">
        <Color green>Appened route</Color>
      </Text>
    )
  }

  return results
}

export const commandProps = {
  name: 'generate',
  alias: 'g',
  description: 'Save time by generating boilerplate code',
}

export default Generate
