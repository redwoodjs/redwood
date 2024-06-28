import type { Prisma, Produce } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.ProduceCreateArgs>({
  produce: {
    one: {
      data: {
        name: 'String6430168',
        quantity: 7893718,
        price: 1113110,
        region: 'String',
        stall: { create: { name: 'String', stallNumber: 'String1437797' } },
      },
    },
    two: {
      data: {
        name: 'String2325729',
        quantity: 9170370,
        price: 9020391,
        region: 'String',
        stall: { create: { name: 'String', stallNumber: 'String8553241' } },
      },
    },
  },
})

export type StandardScenario = ScenarioData<Produce, 'produce'>
