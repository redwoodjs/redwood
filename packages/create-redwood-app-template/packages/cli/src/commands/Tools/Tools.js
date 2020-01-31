import { exec } from 'child_process'

import React from 'react'
import { Box, Text } from 'ink'
import concurrently from 'concurrently'
import { getPaths } from '@redwoodjs/core'

const lint = () => {
  const { base } = getPaths()

  concurrently([
    {
      command: `cd ${base} && yarn eslint 'web/src/**/*.js' 'api/src/**/*.js'`,
    },
  ])
  return null
}

const lintFix = () => {
  const { base } = getPaths()

  concurrently([
    {
      command: `cd ${base} && yarn eslint --fix 'web/src/**/*.js' 'api/src/**/*.js'`,
    },
  ])
  return null
}

export default ({ args }) => {
  const commands = {
    lint,
    'lint fix': lintFix,
    open: () => {
      exec('open http://localhost:8910')
      return null
    },
  }

  const subcommandToRun = args?.[0].slice(1, -1).join(' ')
  if (!commands[subcommandToRun]) {
    // TODO: Improve this with actual usage.
    return (
      <Box>
        <Text>
          yarn rw tools "{subcommandToRun}" is a not a valid argument.
        </Text>
        <Text>Usage: </Text>
        <Text>$ yarn rw tools {Object.keys(commands).join(', ')}</Text>
      </Box>
    )
  }

  return commands[subcommandToRun]({ args })
}

export const commandProps = {
  name: 'tools',
  alias: 't',
  description: 'Lint, bundle analysis, etc.',
}
