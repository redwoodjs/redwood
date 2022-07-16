import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.UserCreateArgs>({
  user: {
    one: {
      data: {
        email: 'String6524956',
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
    two: {
      data: {
        email: 'String5189111',
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
  },
})

export type StandardScenario = typeof standard
