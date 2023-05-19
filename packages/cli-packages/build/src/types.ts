export const REDWOOD_SIDES = ['web', 'api'] as const
export type RedwoodSide = (typeof REDWOOD_SIDES)[number]

export interface BuildYargsOptions {
  side: RedwoodSide[]
  stats: boolean
  verbose: boolean
  prerender: boolean
  prisma: boolean
  performance: boolean
}
