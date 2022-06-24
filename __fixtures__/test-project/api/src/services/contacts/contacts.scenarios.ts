import type { Prisma, Contact } from '@prisma/client'
import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.ContactCreateArgs>({
  contact: {
    one: { data: { name: 'String', email: 'String', message: 'String' } },
    two: { data: { name: 'String', email: 'String', message: 'String' } },
  },
})

export type StandardScenario = ScenarioData<Contact, 'contact'>
