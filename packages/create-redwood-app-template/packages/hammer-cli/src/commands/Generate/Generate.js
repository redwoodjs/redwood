import path from 'path'

import React from 'react'
import { Box, Text, Color } from 'ink'
import { getHammerBaseDir } from '@hammerframework/hammer-core'

import { writeFile, bytes } from 'src/lib'

import component from './generators/component'
import page from './generators/page'

/**
 * A generator is a function that takes a name and returns a list of filenames
 * and contents that should be written to the disk.
 */
const DEFAULT_GENERATORS = [component, page]

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
    generatorName,
    name,
    targetDir = DEFAULT_SRC_DIR(),
  ] = args

  const generator = generators.find(generator => generator.name === generatorName)

  if (!generator || !name) {
    const generatorText = generators.map((generator, i) => {
      return (
        <Box key={i} marginLeft={1}>
          <Box width={12}>
            <Color yellow>{generator.name}</Color></Box>
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
            <Color blue>{generatorName || 'generator'} name [path]</Color>
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
    const files = generator.files(name)
    results = results.concat(Object.keys(files).map((filename) => {
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
    }))
  }

  // Do we need to append any routes?

  if ('routes' in generator) {

  }

  return results
}

export const commandProps = {
  name: 'generate',
  alias: 'g',
  description: 'Save time by generating boilerplate code',
}

export default Generate
