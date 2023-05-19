// #!/usr/bin/env node
import { parseArgs } from 'node:util'

import { defaults } from '../commands/build'
import { handler } from '../commands/buildHandler'
import checkForBabelConfig from '../lib/checkForBabelConfig'
import { BuildYargsOptions, REDWOOD_SIDES, RedwoodSide } from '../types'

async function run() {
  // Parse the arguments
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      stats: {
        type: 'boolean',
      },
      verbose: {
        type: 'boolean',
      },
      prerender: {
        type: 'boolean',
      },
      prisma: {
        type: 'boolean',
      },
      performance: {
        type: 'boolean',
      },
    },
  })

  // Validate the sides
  let sides = defaults['side']
  if (positionals.length !== 0) {
    positionals.forEach((side: string) => {
      if (!REDWOOD_SIDES.includes(side as RedwoodSide)) {
        throw new Error(`Invalid side: ${side}`)
      }
    })
    sides = positionals as RedwoodSide[]
  }

  // Build the options object
  const options: BuildYargsOptions = {
    side: sides,
    stats: values.stats ?? defaults['stats'],
    verbose: values.verbose ?? defaults['verbose'],
    prerender: values.prerender ?? defaults['prerender'],
    prisma: values.prisma ?? defaults['prisma'],
    performance: values.performance ?? defaults['performance'],
  }

  // Run any middleware and then the handler
  checkForBabelConfig()
  await handler(options)
}
run()
