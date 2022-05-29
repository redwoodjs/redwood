import type { Prisma } from '@prisma/client'

export const standard = defineScenario<Prisma.PostCreateArgs>({
  post: {
    one: { data: { title: 'String', body: 'String', authorId: 5448826 } },
    two: { data: { title: 'String', body: 'String', authorId: 1002231 } },
  },
})

export type StandardScenario = typeof standard
