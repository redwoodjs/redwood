import { getPaths } from 'src/lib'

interface Option {
  alias?: string
  default: boolean
  description: string
  type: string
}

export const schema = (): Option => ({
  default: getPaths().api.dbSchema,
  description: 'Specify the Prisma schema location',
  type: 'string',
})
