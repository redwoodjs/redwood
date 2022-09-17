import type { Prisma, User } from '@prisma/client'

import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.UserCreateArgs>({
  user: {
    one: {
      data: {
<<<<<<< HEAD
        email: 'String1171894',
=======
        email: 'String3256260',
>>>>>>> e198945a2 (fix: regenerate test fixture bc of autoprefixer dev dependency change)
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
    two: {
      data: {
<<<<<<< HEAD
        email: 'String1703130',
=======
        email: 'String1290987',
>>>>>>> e198945a2 (fix: regenerate test fixture bc of autoprefixer dev dependency change)
        hashedPassword: 'String',
        fullName: 'String',
        salt: 'String',
      },
    },
  },
})

export type StandardScenario = ScenarioData<User, 'user'>
