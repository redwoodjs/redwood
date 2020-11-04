import terminalLink from 'terminal-link'

import { getPaths } from 'src/lib'

interface Option {
  alias?: string
  default: boolean | string
  description: string
  type: string
}

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
