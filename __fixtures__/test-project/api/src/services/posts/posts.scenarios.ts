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
            email: 'String8448136',
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
            email: 'String493978',
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
