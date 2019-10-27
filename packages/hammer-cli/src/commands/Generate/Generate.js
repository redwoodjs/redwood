import path from 'path'

import React from 'react'
import { Box, Text, Color } from 'ink'
import { getHammerBaseDir } from '@hammerframework/hammer-core'

import { writeFile, bytes } from 'src/lib'

import component from './generators/component'

/**
 * A generator is a function that takes a name and returns a list of filenames
 * and contents that should be written to the disk.
 */
const DEFAULT_GENERATORS = {
  component,
}

const DEFAULT_COMPONENT_DIR = () =>
  path.join(getHammerBaseDir(), './web/src/components/')

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
    generatorName,
    name,
    targetDir = DEFAULT_COMPONENT_DIR(),
  ] = args

  const generator = generators[generatorName]

  if (!generator || !name) {
    return (
      <>
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text bold>Usage</Text>
          </Box>
          <Text>
            hammer generate{' '}
            <Color blue>{generatorName || 'generator'} name [path]</Color>
          </Text>
        </Box>
        <Box flexDirection="column" marginBottom={1}>
          <Text bold underline>
            Available generators:
          </Text>
          <Box marginX={2} flexDirection="column">
            <Text> component</Text>
            <Text> Generate a React component</Text>
          </Box>
        </Box>
      </>
    )
  }

  const files = generator(name)
  const results = Object.keys(files).map((filename) => {
    const contents = files[filename]
    try {
      fileWriter(path.join(targetDir, filename), contents)
      return (
        <Text key={`wrote-${filename}`}>
          Wrote {filename} {bytes(contents)} bytes
        </Text>
      )
    } catch (e) {
      return (
        <Text key={`error-${filename}`}>
          <Color red>{e}</Color>
        </Text>
      )
    }
  })

  return results
}

export const commandProps = {
  name: 'generate',
  alias: 'g',
  description: 'Save time by generating boilerplate code',
}

export default Generate
