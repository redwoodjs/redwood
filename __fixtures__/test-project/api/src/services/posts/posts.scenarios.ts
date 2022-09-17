import type { Prisma, Post } from '@prisma/client'

import type { ScenarioData } from '@redwoodjs/testing/api'

export const standard = defineScenario<Prisma.PostCreateArgs>({
  post: {
    one: {
      data: {
        title: 'String',
        body: 'String',
        author: {
          create: {
<<<<<<< HEAD
            email: 'String5142071',
=======
            email: 'String228100',
>>>>>>> e198945a2 (fix: regenerate test fixture bc of autoprefixer dev dependency change)
            hashedPassword: 'String',
            fullName: 'String',
            salt: 'String',
          },
        },
      },
    },
    two: {
      data: {
        title: 'String',
        body: 'String',
        author: {
          create: {
<<<<<<< HEAD
            email: 'String2527444',
=======
            email: 'String1418565',
>>>>>>> e198945a2 (fix: regenerate test fixture bc of autoprefixer dev dependency change)
            hashedPassword: 'String',
            fullName: 'String',
            salt: 'String',
          },
        },
      },
    },
  },
})

export type StandardScenario = ScenarioData<Post, 'post'>
