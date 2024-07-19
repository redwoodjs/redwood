import type { Prisma, Stall } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.StallCreateArgs>({
  stall: {
    one: { data: { name: 'String', stallNumber: 'String3227467' } },
    two: { data: { name: 'String', stallNumber: 'String3142426' } },
  },
})

export type StandardScenario = ScenarioData<Stall, 'stall'>
