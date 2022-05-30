import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.UserCreateArgs>({
  user: {
    one: {
      data: {
        email: 'String2690644',
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
    two: {
      data: {
        email: 'String6914251',
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
  },
})

export type StandardScenario = typeof standard
