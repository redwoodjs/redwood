import type { Prisma, EmptyUser } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.EmptyUserCreateArgs>({
  emptyUser: {
    one: { data: { email: 'String5770021' } },
    two: { data: { email: 'String5278315' } },
  },
})

export type StandardScenario = ScenarioData<EmptyUser, 'emptyUser'>
