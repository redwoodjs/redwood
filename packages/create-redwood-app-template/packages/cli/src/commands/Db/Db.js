// The `redwood db` commands run in the api folder and allows the user to apply
// the migrations to the database, to generate a client, and to save migrations.
// $ redwood db up
// $ redwood db save

import React from 'react'
import { Box, Text, Color } from 'ink'
import concurrently from 'concurrently'
import { getPaths } from '@redwoodjs/core'

const up = () => {
  const { base } = getPaths()

  concurrently(
    [
      {
        command: `cd ${base}/api && yarn prisma2 migrate up --experimental && yarn prisma2 generate`,
        name: 'migrate',
        prefixColor: 'yellow',
      },
    ],
    {
      prefix: 'name',
    }
  )
  return null
}

const save = () => {
  const { base } = getPaths()

  concurrently(
    [
      {
        command: `cd ${base}/api && yarn prisma2 migrate save --experimental`,
        name: 'migrate',
        prefixColor: 'yellow',
      },
    ],
    {
      prefix: 'name',
    }
  )
  return null
}

export default ({ args }) => {
  const commands = {
    up,
    save,
  }

  const subcommandToRun = args?.[0]?.[1]
  if (!commands[subcommandToRun]) {
    // TODO: Improve this with actual usage.
    return (
      <Box>
        <Text>
          yarn rw database "{subcommandToRun}" is a not a valid argument.
        </Text>
        <Text>Usage: </Text>
        <Text>$ yarn rw db {Object.keys(commands).join(', ')}</Text>
      </Box>
    )
  }

  return commands[subcommandToRun]({ args })
}

export const commandProps = {
  name: 'database',
  alias: 'db',
  description: 'Migrations, generators, all the datase things.',
}
