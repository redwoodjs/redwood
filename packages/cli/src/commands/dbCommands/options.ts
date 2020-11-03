import { getPaths } from 'src/lib'

interface Option {
  alias?: string
  default: boolean
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
