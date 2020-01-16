import React from 'react'
import { Box, Text, Color } from 'ink'
import { getPaths } from '@redwoodjs/core'

import { readFile, writeFile, bytes } from 'src/lib'

import cell from './generators/cell'
import component from './generators/component'
import layout from './generators/layout'
import page from './generators/page'
import scaffold from './generators/scaffold'
import sdl from './generators/sdl'
import service from './generators/service'

const GENERATORS = [cell, component, layout, page, scaffold, sdl, service]

const Generate = ({
  args,
  generators = GENERATORS,
  fileWriter = writeFile,
}) => {
  const redwoodPaths = getPaths()

  const writeFiles = (files) => {
    return Object.keys(files).map((filename) => {
      const contents = files[filename]
      try {
        fileWriter(filename, contents)
        return (
          <Text key={`wrote-${filename}`}>
            <Color green>
              Wrote .{filename.replace(redwoodPaths.base, '')}
            </Color>{' '}
            {bytes(contents)} bytes
          </Text>
        )
      } catch (e) {
        return (
          <Text key={`error-${filename}`}>
            <Color red>{e.message}</Color>
          </Text>
        )
      }
    })
  }

  const [_commandName, generatorCommand, name, ...rest] = args[0]
  const flags = args[1]

  const generator = generators.find(
    (generator) => generator.command === generatorCommand
  )

  // If the generator command is not found in the list of generators, or a
  // second "name" argument is not given, return usage text

  if (!generator || !name) {
    const generatorText = generators.map((generator, i) => {
      return (
        <Box key={i} marginLeft={1}>
          <Box width={12}>
            <Color yellow>{generator.command}</Color>
          </Box>
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
            redwood generate{' '}
            <Color blue>{generatorCommand || 'generator'} name [path]</Color>
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text bold underline>
            Available generators:
          </Text>
        </Box>
        {generatorText}
      </>
    )
  }

  let results = []

  // Do we need to create any files?

  if ('files' in generator) {
    const files = generator.files([args[0].slice(2), args[1]])

    if (files instanceof Promise) {
      files.then((f) => (results = results.concat(writeFiles(f))))
    } else {
      results = results.concat(writeFiles(files))
    }
  }

  // Does this generator need to run any other generators?

  if ('generate' in generator) {
    results = results.concat(
      generator.generate([args[0].slice(2), args[1]]).map((args, i) => {
        const name = args[0][0]
        return (
          <Box key={`generator-${i}`} flexDirection="column">
            <Text>
              <Color yellow>Invoking {name} generator</Color>
            </Text>
            <Box>{Generate({ args: [['g', ...args[0]], args[1]] })}</Box>
          </Box>
        )
      })
    )
  }

  // Do we need to append any routes?

  if ('routes' in generator) {
    const routeFile = readFile(redwoodPaths.web.routes).toString()
    let newRouteFile = routeFile

    generator
      .routes([name, ...rest])
      .reverse()
      .forEach((route, i) => {
        newRouteFile = newRouteFile.replace(
          /(\s*)\<Router\>/,
          `$1<Router>$1  ${route}`
        )
        results.push(
          <Box key={`route-${i}`} flexDirection="column">
            <Text>
              <Color green>Appened route {route}</Color>
            </Text>
          </Box>
        )
      })

    fileWriter(redwoodPaths.web.routes, newRouteFile, {
      overwriteExisting: true,
    })

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
