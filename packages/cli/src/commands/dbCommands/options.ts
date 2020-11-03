import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'

interface Option {
  alias?: string
  default: boolean | number
  description: string
  type: string
}

export const force = (): Option => ({
  alias: 'f',
  default: true,
  description: 'Overwrite existing Client',
  type: 'boolean',
})

export const decrement = (): Option => ({
  default: 1,
  description: 'Number of backwards migrations to apply',
  type: 'number',
})

export const autoApprove = () => ({
  default: false,
  description: 'Skip interactive approval before migrating',
  type: 'boolean',
})

export const dbClient = (): Option => ({
  default: true,
  description: 'Generate the Prisma client',
  type: 'boolean',
})

export const verbose = (): Option => ({
  alias: 'v',
  default: true,
  description: 'Print more',
  type: 'boolean',
})

export const schema = (): Option => ({
  default: getPaths().api.dbSchema,
  description: 'Specify the Prisma schema location',
  type: 'string',
})

export const epilogue = (): string =>
  `Also see the ${terminalLink(
    'Redwood CLI Reference',
    'https://redwoodjs.com/reference/command-line-interface#db-generate'
  )}`
