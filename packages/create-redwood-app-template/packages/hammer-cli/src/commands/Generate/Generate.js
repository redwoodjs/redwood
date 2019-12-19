import path from 'path'

import React from 'react'
import { Box, Text, Color } from 'ink'
import { getHammerBaseDir } from '@hammerframework/hammer-core'

import { readFile, writeFile, bytes } from 'src/lib'

import component from './generators/component'
import layout from './generators/layout'
import page from './generators/page'
import service from './generators/service'

const DEFAULT_GENERATORS = [component, layout, page, service]
const SRC_PATH = './web/src'
const ROUTE_PATH = `${SRC_PATH}/Routes.js`

const DEFAULT_SRC_DIR = () =>
  path.join(getHammerBaseDir(), SRC_PATH)

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

  const [_commandName, generatorCommand, name, ...rest] = args

  const generator = generators.find(generator => generator.command === generatorCommand)

  // If the generator command is not found in the list of generators, or a
  // second "name" argument is not given, return usage text

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

  // Do we need to create any files?

  if ('files' in generator) {
    const files = generator.files([name, ...rest])
    results = results.concat(Object.keys(files).map((filename) => {
      const contents = files[filename]
      try {
        fileWriter(path.join(DEFAULT_SRC_DIR(), filename), contents)
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
    const routeFile = readFile(ROUTE_PATH).toString()
    let newRouteFile = routeFile

    generator.routes([name, ...rest]).forEach(route => {
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
